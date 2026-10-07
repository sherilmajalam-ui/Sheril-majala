import { useEffect, useState } from "react";
import { productEmoji } from "../utils";

// Photo if the product has one, emoji if not (or if the photo fails to load)
export default function ProductPicture({ product }) {
    const [failed, setFailed] = useState(false);
    const emoji = productEmoji(product.product_name, product.category);

    useEffect(() => setFailed(false), [product.image_url]);

    if (product.image_url && !failed) {
        return (
            <img
                src={product.image_url}
                alt={product.product_name}
                loading="lazy"
                onError={() => setFailed(true)}
            />
        );
    }
    return emoji;
}
