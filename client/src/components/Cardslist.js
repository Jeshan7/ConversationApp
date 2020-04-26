import React from 'react';
import '../assets/css/Dashboard.css';
import Card from './Card';

const Cardslist = (props) => {
    return (
        <div className="Cardslist">
            {props.cards.map((card, index) => {
                return <Card key={card.key} index={card.key} data={card} />
            })
            }
        </div>
    );
}

export default Cardslist;