import React, { useState, useEffect, useRef } from 'react';
import '../assets/css/Dashboard.css';
import Card from './Card';

const Cardslist = (props) => {
    const cardsEndRef = useRef(null)
    
    const scrollToBottom = () => {
        cardsEndRef.current.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(scrollToBottom, [props.cards]);
    
    return (
        <div className="Cardslist">
            {
                props.cards.map((card, index) => {
                    return <Card key={card.key} index={card.key} data={card} />
                })
            }
            <div ref={cardsEndRef} />
        </div>
    );
}

export default Cardslist;

