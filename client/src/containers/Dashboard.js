import React, { Component } from 'react';
import '../assets/css/Dashboard.css';
import Cardslist from '../components/Cardslist';

class Dashboard extends Component {
    render() {
        return (
            <div className="Dashboard">
                <div className="options-container">
                    <div className="options">
                        <button>Add</button >
                        <button>Listen</button>
                        <button>Download</button>
                    </div>
                </div>
                <div className="cards-container">
                    <Cardslist />
                </div>
            </div>
        );
    }
}

export default Dashboard;