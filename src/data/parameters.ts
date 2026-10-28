import { ParameterCategory } from "@/types";

export interface ParameterOption {
  value: string;
  label: string;
  description?: string;
}

export interface ParameterCategoryDef {
  category: ParameterCategory;
  label: string;
  description: string;
  options: ParameterOption[];
}

export const parameterCategories: ParameterCategoryDef[] = [
  {
    category: "device",
    label: "Device Type",
    description: "What type of lithium battery device",
    options: [
      { value: "phone", label: "Mobile Phone", description: "Smartphone/PED (typically 10-20Wh)" },
      { value: "laptop", label: "Laptop", description: "Notebook computer (typically 30-90Wh)" },
      { value: "tablet", label: "Tablet", description: "Tablet device (typically 20-40Wh)" },
      { value: "powerbank", label: "Power Bank", description: "Portable battery pack (varies 10-200Wh+)" },
      { value: "vape", label: "E-cigarette/Vape", description: "Personal vaporizer (typically < 30Wh)" },
      { value: "mobility_aid", label: "Mobility Aid Battery", description: "Wheelchair/scooter battery (often large capacity)" },
      { value: "smart_luggage", label: "Smart Luggage", description: "With non-removable/removable battery" },
      { value: "drone", label: "Drone Battery", description: "Spare drone battery (often 50-300Wh)" },
      { value: "camera", label: "Camera/Professional", description: "Camera/professional equipment battery" },
      { value: "medical", label: "Medical Device", description: "Medical device with battery" },
    ],
  },
  {
    category: "capacity",
    label: "Battery Capacity / Energy (Wh)",
    description: "Rated energy - critical for fire intensity and response",
    options: [
      { value: "<20wh", label: "< 20 Wh", description: "Small cells - lower fire load" },
      { value: "20-100wh", label: "20 - 100 Wh", description: "Most common PEDs/powerbanks" },
      { value: "100-160wh", label: "100 - 160 Wh", description: "Larger powerbanks/laptops - often restricted, higher fire load" },
      { value: ">160wh", label: "> 160 Wh", description: "High energy - significant fire intensity, major concern" },
      { value: "unknown", label: "Unknown", description: "Cannot confirm capacity - treat as elevated risk" },
    ],
  },
  {
    category: "phase",
    label: "Flight Phase",
    description: "When the situation occurs",
    options: [
      { value: "boarding", label: "Boarding", description: "During boarding" },
      { value: "taxi", label: "Taxi", description: "Taxiing to/from runway" },
      { value: "takeoff", label: "Take-off", description: "Critical take-off phase" },
      { value: "flight", label: "In-Flight", description: "Cruise/climb/descent" },
      { value: "landing", label: "Landing", description: "Critical landing phase" },
      { value: "deplaning", label: "Deplaning", description: "After arrival" },
      { value: "ground_servicing", label: "Ground Servicing", description: "Ground operations" },
    ],
  },
  {
    category: "location",
    label: "Location",
    description: "Where the device is located",
    options: [
      { value: "seat_pocket", label: "Seat Pocket", description: "In front seat pocket" },
      { value: "between_seats", label: "Between Seats", description: "Stuck/trapped between seats" },
      { value: "overhead_bin", label: "Overhead Bin", description: "In overhead stowage bin" },
      { value: "checked_baggage", label: "Checked Baggage", description: "In hold/checked baggage" },
      { value: "carry_on_bag", label: "Carry-on Bag", description: "In passenger carry-on" },
      { value: "lavatory", label: "Lavatory", description: "In aircraft lavatory" },
      { value: "emergency_exit", label: "Emergency Exit Area", description: "Near emergency exit" },
      { value: "flight_deck", label: "Flight Deck", description: "On flight deck" },
      { value: "aisle", label: "Aisle", description: "In aisle area" },
      { value: "cargo_hold", label: "Cargo Hold", description: "In cargo compartment" },
    ],
  },
  {
    category: "condition",
    label: "Condition/State",
    description: "State of the device/battery",
    options: [
      { value: "normal", label: "Normal/Undamaged", description: "No visible damage" },
      { value: "damaged", label: "Damaged", description: "Physically damaged" },
      { value: "trapped", label: "Trapped/Stuck", description: "Mechanically trapped/crushed" },
      { value: "charging", label: "Charging", description: "Actively charging" },
      { value: "overheating", label: "Overheating", description: "Becoming hot/smoking" },
      { value: "thermal_runaway", label: "Thermal Runaway", description: "In thermal runaway" },
      { value: "smoke", label: "Emitting Smoke", description: "Producing smoke" },
      { value: "exposed_terminals", label: "Exposed Terminals", description: "Terminals exposed" },
    ],
  },
  {
    category: "quantity",
    label: "Quantity",
    description: "Number of batteries/devices",
    options: [
      { value: "1", label: "Single (1)", description: "One battery/device" },
      { value: "2", label: "Two (2)", description: "Two batteries/devices" },
      { value: "3+", label: "Multiple (3+)", description: "Three or more" },
    ],
  },
  {
    category: "charging",
    label: "Charging State",
    description: "Charging related factors",
    options: [
      { value: "not_charging", label: "Not Charging", description: "Not connected to power" },
      { value: "aircraft_power", label: "From Aircraft Power", description: "Charging from aircraft USB/power" },
      { value: "powerbank_charging", label: "Power Bank Charging", description: "Power bank being used to charge" },
      { value: "unintended_activation", label: "Unintended Activation", description: "Accidentally activated" },
    ],
  },
];
