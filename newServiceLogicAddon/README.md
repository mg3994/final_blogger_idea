# New Service Dependency Logic Addon

This directory contains the logic for handling complex Service-to-Product dependencies in the Schema.org driven Blogger engine.

## Logic Overview

### 1. Linked Add-ons
Services can be marked as dependent on a specific product.
- **Trigger**: Setting `isLinkedAddon: true` and `parentProductName: "Product Name"` in the Service JSON-LD.
- **Behavior**:
    - The "Add Service" button is disabled in the UI if the parent product is not present in the cart.
    - If the parent product is removed from the cart, all linked add-on services are automatically removed via a cascading deletion algorithm.
    - **Quantity Restriction**: If `maxQuantity: 1` is set, the service can only be added once. Subsequent clicks are ignored (or show a toast warning).

### 2. Handy / Visiting Services
Services that represent a visit or manual labor for a product the user already owns.
- **Trigger**: Setting `serviceType: "Visiting"` or `requiresPriorOwnership: true`.
- **Behavior**: These services are always addable to the cart, as the logic assumes the user already possesses the physical item at their location.

## Implementation Files
- `logic.js`: The core dependency checking engine.
- `template.xml`: Integrated cascading removal and UI state management.
