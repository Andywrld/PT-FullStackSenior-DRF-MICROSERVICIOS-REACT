import jwt
import pytest
from rest_framework import status

from accounts.models import User
from accounts.tests.conftest import PASSWORD

pytestmark = pytest.mark.django_db

REGISTER_URL = "/api/v1/auth/register/"
REFRESH_URL = "/api/v1/auth/refresh/"
LOGOUT_URL = "/api/v1/auth/logout/"
ME_URL = "/api/v1/auth/me/"
USERS_URL = "/api/v1/auth/users/"


def data(response):
    return response.json()["data"]


def error_code(response):
    return response.json()["error"]["code"]


def test_register_always_creates_a_regular_user(api_client):
    payload = {"email": "New@Example.com", "password": "Str0ng-passphrase!", "role": "super_admin"}

    response = api_client.post(REGISTER_URL, payload, format="json")

    assert response.status_code == status.HTTP_201_CREATED
    user = data(response)
    assert user["role"] == "user"  # the `role` sent by the client is ignored
    assert user["email"] == "new@example.com"
    assert "password" not in user


def test_login_returns_tokens_other_services_can_verify_with_the_jwks(api_client, user_factory, login):
    user = user_factory(role=User.Role.ADMIN)

    body = data(login(user))

    jwk_set = jwt.PyJWKSet.from_dict(api_client.get("/.well-known/jwks.json").json())
    header = jwt.get_unverified_header(body["access_token"])
    [key] = [k for k in jwk_set.keys if k.key_id == header["kid"]]
    claims = jwt.decode(
        body["access_token"], key.key, algorithms=["RS256"], audience="marketplace", issuer="marketplace-auth"
    )
    assert (claims["sub"], claims["role"], claims["type"]) == (str(user.id), "admin", "access")
    assert body["token_type"] == "Bearer"
    assert body["user"]["email"] == user.email


def test_wrong_password_and_unknown_email_get_the_same_401(user_factory, login):
    user = user_factory()

    wrong_password = login(user, password="not-the-password")
    unknown_email = login("nobody@example.com")

    for response in (wrong_password, unknown_email):
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert error_code(response) == "invalid_credentials"
    assert wrong_password.json()["error"]["message"] == unknown_email.json()["error"]["message"]


def test_refresh_rotates_tokens_and_reuse_revokes_the_whole_family(api_client, user_factory, login):
    first_refresh = data(login(user_factory()))["refresh_token"]

    rotated = api_client.post(REFRESH_URL, {"refresh_token": first_refresh}, format="json")
    assert rotated.status_code == status.HTTP_200_OK
    second_refresh = data(rotated)["refresh_token"]

    # Replaying the old token looks like theft: it fails AND kills the new one too.
    replay = api_client.post(REFRESH_URL, {"refresh_token": first_refresh}, format="json")
    assert replay.status_code == status.HTTP_401_UNAUTHORIZED
    assert error_code(replay) == "invalid_refresh_token"
    after = api_client.post(REFRESH_URL, {"refresh_token": second_refresh}, format="json")
    assert after.status_code == status.HTTP_401_UNAUTHORIZED


def test_logout_revokes_the_refresh_token(api_client, user_factory, login):
    refresh = data(login(user_factory()))["refresh_token"]

    assert api_client.post(LOGOUT_URL, {"refresh_token": refresh}, format="json").status_code == 200

    response = api_client.post(REFRESH_URL, {"refresh_token": refresh}, format="json")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_refresh_token_is_not_accepted_as_access_token(api_client, user_factory, login):
    refresh = data(login(user_factory()))["refresh_token"]
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh}")

    response = api_client.get(ME_URL)

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert error_code(response) == "invalid_token"


def test_only_super_admin_can_manage_users(user_factory, client_for):
    admin = user_factory(role=User.Role.ADMIN)
    super_admin = user_factory(role=User.Role.SUPER_ADMIN)
    target = user_factory()

    assert client_for(admin).get(USERS_URL).status_code == status.HTTP_403_FORBIDDEN

    boss = client_for(super_admin)
    listing = boss.get(USERS_URL)
    assert listing.json()["meta"]["pagination"]["total_items"] == 3

    promoted = boss.patch(f"{USERS_URL}{target.id}/", {"role": "admin"}, format="json")
    assert data(promoted)["role"] == "admin"

    self_demotion = boss.patch(f"{USERS_URL}{super_admin.id}/", {"role": "user"}, format="json")
    assert self_demotion.status_code == status.HTTP_400_BAD_REQUEST


def test_super_admin_creates_edits_searches_and_deletes_accounts(user_factory, client_for, login):
    boss = client_for(user_factory(role=User.Role.SUPER_ADMIN))
    created = boss.post(
        USERS_URL,
        {"email": "Nueva@Example.com", "full_name": "Nueva", "password": PASSWORD, "role": "admin"},
        format="json",
    )
    assert created.status_code == status.HTTP_201_CREATED
    new_user = data(created)
    assert (new_user["email"], new_user["role"]) == ("nueva@example.com", "admin")
    assert login("nueva@example.com").status_code == status.HTTP_200_OK

    new_password = "0tra-clave-segura!"
    edited = boss.patch(
        f"{USERS_URL}{new_user['id']}/", {"full_name": "Renombrada", "password": new_password}, format="json"
    )
    assert data(edited)["full_name"] == "Renombrada"
    assert login("nueva@example.com", new_password).status_code == status.HTTP_200_OK

    assert boss.get(USERS_URL, {"search": "renombrada"}).json()["meta"]["pagination"]["total_items"] == 1
    assert boss.delete(f"{USERS_URL}{new_user['id']}/").status_code == status.HTTP_200_OK
    assert login("nueva@example.com", new_password).status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.parametrize("term", ["jose perez", "josé pérez", "JOSÉ", "perez"])
def test_users_are_found_by_name_regardless_of_accents_and_case(user_factory, client_for, term):
    boss = client_for(user_factory(role=User.Role.SUPER_ADMIN))
    User.objects.create_user("jose@example.com", PASSWORD, full_name="José Pérez")
    User.objects.create_user("ana@example.com", PASSWORD, full_name="Ana Gómez")

    found = boss.get(USERS_URL, {"search": term}).json()["data"]

    assert [user["email"] for user in found] == ["jose@example.com"]


def test_an_unaccented_name_is_found_by_an_accented_term_and_email_search_still_works(user_factory, client_for):
    boss = client_for(user_factory(role=User.Role.SUPER_ADMIN))
    User.objects.create_user("maria@example.com", PASSWORD, full_name="Maria Lopez")

    by_name = boss.get(USERS_URL, {"search": "maría lópez"}).json()["data"]
    by_email = boss.get(USERS_URL, {"search": "MARIA@example"}).json()["data"]

    assert [user["email"] for user in by_name] == ["maria@example.com"]
    assert [user["email"] for user in by_email] == ["maria@example.com"]


def test_deactivating_an_account_ends_its_sessions_and_nobody_locks_themselves_out(
    api_client, user_factory, client_for, login
):
    me = user_factory(role=User.Role.SUPER_ADMIN)
    target = user_factory()
    refresh_token = data(login(target))["refresh_token"]
    boss = client_for(me)

    boss.patch(f"{USERS_URL}{target.id}/", {"is_active": False}, format="json")
    assert api_client.post(REFRESH_URL, {"refresh_token": refresh_token}, format="json").status_code == 401

    assert boss.delete(f"{USERS_URL}{me.id}/").status_code == status.HTTP_400_BAD_REQUEST
    unchanged = {"full_name": "Yo", "role": "super_admin", "is_active": True}
    assert boss.patch(f"{USERS_URL}{me.id}/", unchanged, format="json").status_code == status.HTTP_200_OK
    assert boss.patch(f"{USERS_URL}{me.id}/", {"is_active": False}, format="json").status_code == 400
