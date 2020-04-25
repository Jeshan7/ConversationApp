import React, { Component } from 'react';
import '../assets/css/Dashboard.css';
import Cardslist from '../components/Cardslist';
import fire from '../utils/firebaseConfig';

class Dashboard extends Component {
    state = {
        allCards: []
    }
    addConversation = () => {
        fire.firestore().collection('/conversation-cards').add({
            cardIndex: 2,
            insertedAt: Date.now(),
            updatedAt: Date.now(),
        })
    }

    componentDidMount = () => {
        this.fetchAllConversationCards();
    }

    fetchAllConversationCards = () => {
        fire
            .firestore()
            .collection('/conversation-cards')
            .onSnapshot((snapshot) => {
                let querySnapshot = snapshot.docs;
                var allCards = [];
                querySnapshot.forEach(doc => {
                    let { insertedAt, updatedAt, cardIndex } = doc.data();
                    console.log("a", doc.id)
                    allCards.push({
                        key: doc.id,
                        insertedAt,
                        updatedAt,
                        cardIndex
                    })
                })
                this.setState({ allCards })
                // console.log(doc.data());

            })

        // console.log("snap", snapshot.docs)
    }

    render() {
        return (
            <div className="Dashboard">
                <div className="options-container">
                    <div className="options">
                        <button onClick={this.addConversation}>Add</button >
                        <button>Listen</button>
                        <button>Download</button>
                    </div>
                </div>
                <div className="cards-container">
                    <Cardslist cards={this.state.allCards}/>
                </div>
            </div>
        );
    }
}

export default Dashboard;