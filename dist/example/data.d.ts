interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
}
/**
 * Fetches a product by its ID.
 * @param id The ID of the product.
 * @returns The product if found, otherwise null.
 */
export declare function fetchProductById(id: string): Promise<Product | null>;
/**
 * Adds a new product to the list.
 * @param product The product data to add.
 * @returns The newly added product.
 */
export declare function addProduct(product: Omit<Product, 'id'>): Promise<Product>;
/**
 * Modifies an existing product.
 * @param id The ID of the product to modify.
 * @param updates The updates to apply.
 * @returns The updated product if found, otherwise null.
 */
export declare function modifyProduct(id: string, updates: Partial<Omit<Product, 'id'>>): Promise<Product | null>;
/**
 * Removes a product by its ID.
 * @param id The ID of the product to remove.
 */
export declare function removeProduct(id: string): Promise<void>;
export {};
