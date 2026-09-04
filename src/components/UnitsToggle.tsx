import { Ruler } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { UnitSystem } from "@/lib/units"

interface Props {
  units: UnitSystem
  onChange: (units: UnitSystem) => void
}

export function UnitsToggle({ units, onChange }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="lg"
            aria-label="Change units"
            className="glass min-w-16 font-semibold tabular-nums"
          >
            <Ruler />
            {units === "metric" ? "°C" : "°F"}
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-auto min-w-52">
        <DropdownMenuRadioGroup
          value={units}
          onValueChange={(value) => onChange(value as UnitSystem)}
        >
          <DropdownMenuLabel>Units</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioItem value="metric">
            Metric
            <DropdownMenuShortcut>°C · km/h · mm</DropdownMenuShortcut>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="imperial">
            Imperial
            <DropdownMenuShortcut>°F · mph · in</DropdownMenuShortcut>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
