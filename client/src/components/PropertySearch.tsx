import React, { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getProperties } from "@/lib/data";
import { ChevronsUpDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Property } from "@shared/schema";

interface PropertySearchProps {
  onSelect?: () => void;
}

export default function PropertySearch({ onSelect }: PropertySearchProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [, setLocation] = useLocation();

  const { data: properties = [] } = useQuery({
    queryKey: ['/api/properties'],
    queryFn: getProperties,
  });

  // Properties with additional display information for searching
  const propertyOptions = properties.map((property: Property) => ({
    value: property.id.toString(),
    label: property.name,
    address: property.address,
    locationId: property.locationId,
  }));

  // Filter properties based on search query
  const filteredProperties = propertyOptions.filter((property) => {
    if (!searchValue) return true;
    
    const searchLower = searchValue.toLowerCase();
    return (
      property.label.toLowerCase().includes(searchLower) ||
      property.address.toLowerCase().includes(searchLower)
    );
  });

  // Handle property selection
  const handleSelect = (propertyId: string) => {
    const selectedProperty = properties.find(
      (property: Property) => property.id.toString() === propertyId
    );
    
    if (selectedProperty) {
      setLocation(`/properties/${propertyId}`);
      
      // Call the onSelect callback if provided
      if (onSelect) {
        onSelect();
      }
    }
    
    setOpen(false);
  };

  return (
    <div className="flex w-full max-w-sm items-center space-x-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-white"
          >
            <div className="flex items-center">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              {searchValue ? searchValue : "Search properties..."}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput 
              placeholder="Search by address..." 
              value={searchValue}
              onValueChange={setSearchValue}
              className="h-9"
            />
            <CommandList>
              <CommandEmpty>No properties found.</CommandEmpty>
              <CommandGroup>
                {filteredProperties.map((property) => (
                  <CommandItem
                    key={property.value}
                    value={property.value}
                    onSelect={handleSelect}
                    className="cursor-pointer"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{property.label}</span>
                      <span className="text-sm text-gray-500">{property.address}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}