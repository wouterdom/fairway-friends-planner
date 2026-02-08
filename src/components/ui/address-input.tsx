import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MapPin, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AddressPrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

interface AddressInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (prediction: AddressPrediction) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

const AddressInput: React.FC<AddressInputProps> = ({
  value,
  onChange,
  onSelect,
  placeholder = "Enter an address...",
  className,
  id,
}) => {
  const [open, setOpen] = useState(false);
  const [predictions, setPredictions] = useState<AddressPrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const warnedRef = useRef(false);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!value || value.length < 3) {
      setPredictions([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('places-autocomplete', {
          body: { input: value, types: 'address' }
        });

        if (error) throw error;

        if (data?.warning && !warnedRef.current) {
          console.warn('Places autocomplete warning:', data.warning, data?.hint);
          toast.error('Address suggestions are unavailable right now.');
          warnedRef.current = true;
        }

        const nextPredictions = (data?.predictions || []) as AddressPrediction[];
        setPredictions(nextPredictions);
        setOpen(nextPredictions.length > 0);
      } catch (error) {
        console.error('Error fetching predictions:', error);
        setPredictions([]);
        setOpen(false);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value]);

  const handleSelect = (prediction: AddressPrediction) => {
    onChange(prediction.description);
    onSelect?.(prediction);
    setOpen(false);
    setPredictions([]);
  };

  return (
    <Popover open={open && predictions.length > 0} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative w-full">
          <Input
            ref={inputRef}
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={className}
            autoComplete="off"
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent 
        className="p-0 w-[var(--radix-popover-trigger-width)]" 
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command>
          <CommandList>
            <CommandEmpty>No addresses found</CommandEmpty>
            <CommandGroup>
              {predictions.map((prediction) => (
                <CommandItem
                  key={prediction.placeId}
                  value={prediction.description}
                  onSelect={() => handleSelect(prediction)}
                  className="cursor-pointer"
                >
                  <MapPin className="w-4 h-4 mr-2 text-muted-foreground flex-shrink-0" />
                  <div className="flex flex-col overflow-hidden">
                    <span className="font-medium truncate">{prediction.mainText}</span>
                    <span className="text-sm text-muted-foreground truncate">
                      {prediction.secondaryText}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default AddressInput;
