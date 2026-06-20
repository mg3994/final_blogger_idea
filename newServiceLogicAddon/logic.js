/**
 * newServiceLogicAddon/logic.js
 * Implements Dependency and Handyman service logic for Schema.org
 */

export const ServiceDependencyEngine = {
  /**
   * Checks if a service can be added to the cart
   * @param {object} service - The service item
   * @param {object} cartItems - Current items in cart
   * @returns {object} { allowed: boolean, reason: string }
   */
  canAddService(service, cartItems) {
    // 1. Check if it's a "Handy" / Visiting service that requires ownership but not purchase
    if (service.serviceType === 'Visiting' || service.requiresPriorOwnership) {
      return { allowed: true, reason: 'Assumes user already owns the product.' };
    }

    // 2. Check if it's a Product-Linked Add-on
    if (service.itemOffered?.isLinkedAddon || service.isLinkedAddon) {
      const parentName = service.parentProductName || service.itemOffered?.parentProductName;
      const hasParent = cartItems.some(i => i.orderedItem.name === parentName);

      if (!hasParent) {
        return { allowed: false, reason: `Requires ${parentName} in cart.` };
      }

      // Check for quantity restriction (Addons usually restricted to 1 per order or 1 total)
      const existing = cartItems.find(i => i.orderedItem.name === service.name || i.orderedItem.name === service.itemOffered?.name);
      if (existing && (service.maxQuantity === 1 || service.itemOffered?.maxQuantity === 1)) {
        return { allowed: false, reason: 'This addon can only be added once.' };
      }
    }

    return { allowed: true };
  },

  /**
   * Finds linked items that should be removed when a parent is removed
   * @param {string} parentName - Name of the product being removed
   * @param {array} cartItems - Full cart
   * @returns {array} Indexes to remove
   */
  getDependentIndexes(parentName, cartItems) {
    return cartItems
      .map((item, idx) => {
        const isLinked = item.orderedItem.isLinkedAddon || item.orderedItem.itemOffered?.isLinkedAddon;
        const linkedTo = item.orderedItem.parentProductName || item.orderedItem.itemOffered?.parentProductName;
        return (isLinked && linkedTo === parentName) ? idx : -1;
      })
      .filter(idx => idx !== -1);
  }
};
