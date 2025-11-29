import React from 'react';

interface KayakCardProps {
    kayak: {
        id: string;
        name: string;
        description: string;
        price: number;
        imageUrl: string;
    };
    onRent: (id: string) => void;
}

const KayakCard: React.FC<KayakCardProps> = ({ kayak, onRent }) => {
    return (
        <div className="kayak-card">
            <img src={kayak.imageUrl} alt={kayak.name} />
            <h3>{kayak.name}</h3>
            <p>{kayak.description}</p>
            <p>Price: ${kayak.price.toFixed(2)} per hour</p>
            <button onClick={() => onRent(kayak.id)}>Rent Now</button>
        </div>
    );
};

export default KayakCard;