import { SearchIcon, XIcon } from 'lucide-react'

import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/shared/ui/input-group'

type CatalogSearchFieldProps = {
  value: string
  onChange: (value: string) => void
}

export function CatalogSearchField({ value, onChange }: CatalogSearchFieldProps) {
  return (
    <InputGroup className="h-11 max-w-md">
      <InputGroupAddon>
        <SearchIcon />
      </InputGroupAddon>
      <InputGroupInput
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Buscar por nombre o SKU"
        aria-label="Buscar productos"
      />
      {value && (
        <InputGroupAddon align="inline-end">
          <InputGroupButton size="icon-xs" aria-label="Borrar búsqueda" onClick={() => onChange('')}>
            <XIcon />
          </InputGroupButton>
        </InputGroupAddon>
      )}
    </InputGroup>
  )
}
