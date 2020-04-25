import React, { Component } from 'react';
import '../assets/css/Dashboard.css';
import Cardslist from '../components/Cardslist';
import { storage } from '../utils/firebaseConfig';
import fire from '../utils/firebaseConfig';
import Crunker from 'crunker';

class Dashboard extends Component {
    state = {
        allCards: []
    }

    audio = new Crunker();

    addConversation = () => {
        let newCard = {
            botTextInput: "",
            customerTextInput: "",
            insertedAt: null,
            updatedAt: null,
            botRecording: false,
            customerRecording: false
        };

        let a = this.state.allCards.every((data) => {
            return data.insertedAt !== null;
        })

        let b = this.state.allCards.every((data) => {
            return (data.botRecording && data.customerRecording);
        })
        //  console.log("ass", b)
        if (a && b) {
            let allCards = [...this.state.allCards, newCard];
            this.setState({ allCards })
        }
    }

    componentDidMount = () => {
        this.fetchAllConversationCards();
    }

    fetchAllConversationCards = () => {
        fire
            .firestore()
            .collection('/conversation-snippets')
            .onSnapshot((snapshot) => {
                let querySnapshot = snapshot.docs;
                var allCards = [];
                console.log("sas", querySnapshot)
                querySnapshot.forEach(doc => {
                    let { insertedAt,
                        updatedAt,
                        botTextInput,
                        customerTextInput,
                        botRecording,
                        customerRecording } = doc.data();
                    console.log("a", doc.id)
                    if (botRecording && customerRecording) {
                        this.combineRecordings(doc.id);
                    }
                    allCards.push({
                        key: doc.id,
                        botTextInput,
                        customerTextInput,
                        insertedAt,
                        updatedAt,
                        botRecording,
                        customerRecording
                    })
                })
                this.setState({ allCards })
            })

        console.log("snap", this.state.allCards)
    }

    combineRecordings = (id) => {
        let fileName1 = id + "-bot-recording.mp3";
        let fileName2 = id + "-customer-recording.mp3";
        var a1 = null;
        var a2 = null;
        var self = this;

        storage.ref().child(`bot-recordings/${fileName1}`).getDownloadURL().then(function (url) {
            a1 = url;
            storage.ref().child(`customer-recordings/${fileName2}`).getDownloadURL().then(function (url) {
                a2 = url;
                self.audio
                    .fetchAudio(a1, a2)
                    .then(buffers => {
                        let mergedFiles = self.audio.concatAudio(buffers)
                        let mergedMp3 = self.audio.export(mergedFiles, "audio/mp3")
                        let fileName = id + "-snippet-recording.mp3";
                        console.log(mergedMp3.blob, "ass", fileName)
                        storage.ref(`snippet-recordings/${fileName}`).put(mergedMp3.blob);
                    })
                    .catch(error => {
                        throw new Error(error);
                    });
            })
        })
    }
    render() {
        return (
            <div className="Dashboard">
                <div className="options-container">
                    <div className="options">
                        <button onClick={this.addConversation}>Add</button >
                        <button onClick={this.abc}>Listen</button>
                        <button>Download</button>
                    </div>
                </div>
                <div className="cards-container">
                    <Cardslist cards={this.state.allCards} />
                </div>
            </div>
        );
    }
}

export default Dashboard;