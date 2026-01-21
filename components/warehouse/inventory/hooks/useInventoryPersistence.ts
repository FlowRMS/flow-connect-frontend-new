import { useCallback } from "react";
import { toast } from "sonner";
import { 
    useAddInventoryItemMutation, 
    useDeleteInventoryItemMutation, 
    useUpdateInventoryItemMutation,
    useUpdateInventoryMutation 
} from "../api/useInventoryApi";
import { Inventory, ProductBinLocation } from "@/lib/types/warehouse";

interface EditableSettings {
    abcClass: string | undefined;
    ownershipType: string;
}

export function useInventoryPersistence() {
    const [addInventoryItem] = useAddInventoryItemMutation();
    const [deleteInventoryItem] = useDeleteInventoryItemMutation();
    const [updateInventoryItem] = useUpdateInventoryItemMutation();
    const [updateInventory] = useUpdateInventoryMutation();

    const saveProductProfile = useCallback(async (
        inventory: Inventory,
        newBinLocations: ProductBinLocation[],
        newSettings: EditableSettings
    ) => {
        let successCount = 0;
        let errorCount = 0;

        const currentItems = inventory.items || [];
        const processedIds = new Set<string>();
        const unassignedItems = currentItems.filter(item => !item.locationId);
        let unassignedIndex = 0;

        for (const bin of newBinLocations) {
            if (bin.id.startsWith("BL-")) {
                if (unassignedIndex < unassignedItems.length) {
                    const itemToUpdate = unassignedItems[unassignedIndex];
                    unassignedIndex++;
                    processedIds.add(itemToUpdate.id);
                    try {
                        await updateInventoryItem({
                            variables: {
                                input: {
                                    id: itemToUpdate.id,
                                    locationId: bin.binId,
                                }
                            }
                        });
                        successCount++;
                    } catch (e) {
                        errorCount++;
                    }
                } else {
                    try {
                        await addInventoryItem({
                            variables: {
                                input: {
                                    inventoryId: inventory.id,
                                    locationId: bin.binId,
                                    quantity: bin.currentQuantity || 0,
                                    status: "AVAILABLE"
                                }
                            }
                        });
                        successCount++;
                    } catch (e) {
                        errorCount++;
                    }
                }
            } else {
                processedIds.add(bin.id);
            }
        }

        for (const item of currentItems) {
            if (!processedIds.has(item.id)) {
                try {
                    await deleteInventoryItem({
                        variables: { id: item.id }
                    });
                    successCount++;
                } catch (e) {
                    errorCount++;
                }
            }
        }

        const updates: any = {};
        if (newSettings.abcClass !== inventory.abcClass) {
            updates.abcClass = newSettings.abcClass || null;
        }

        if (newSettings.ownershipType !== inventory.ownershipType) {
            updates.ownershipType = newSettings.ownershipType;
        }

        if (Object.keys(updates).length > 0) {
            try {
                await updateInventory({
                    variables: {
                        input: {
                            id: inventory.id,
                            ...updates
                        }
                    }
                });
                successCount++;
            } catch (e) {
                errorCount++;
            }
        }

        if (errorCount > 0) {
            toast.warning(`Saved with some errors (${successCount} succeeded, ${errorCount} failed)`);
        } else if (successCount > 0) {
            toast.success("Changes saved successfully");
        } else {
            toast.info("No changes to save");
        }

    }, [addInventoryItem, deleteInventoryItem, updateInventoryItem, updateInventory]);

    return { saveProductProfile };
}
