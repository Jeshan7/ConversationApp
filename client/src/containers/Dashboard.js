import React, { Component } from 'react';
import '../assets/css/Dashboard.css';
import Cardslist from '../components/Cardslist';
import { storage } from '../utils/firebaseConfig';
import fire from '../utils/firebaseConfig';
import Crunker from 'crunker';
import soundIcon from '../assets/icons/sound.png';
import downloadIcon from '../assets/icons/download.png';
import addIcon from '../assets/icons/add.png';

class Dashboard extends Component {
    state = {
        allCards: [],
        url: null,
        addCard: true
    }

    audio = new Crunker()

    addConversation = () => {
        let newCard = {
            botTextInput: "",
            customerTextInput: "",
            insertedAt: null,
            updatedAt: null,
            botRecording: false,
            customerRecording: false,
            snippetRecording: false,
            recordingName: null
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
            .orderBy("updatedAt", "asc")
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
                        customerRecording,
                        snippetRecording,
                        recordingName } = doc.data();
                    console.log("a", doc.id)
                    if (botRecording && customerRecording && !snippetRecording) {
                        this.setState({ addCard: false })
                        this.combineRecordings(doc.id);
                    }
                    allCards.push({
                        key: doc.id,
                        botTextInput,
                        customerTextInput,
                        insertedAt,
                        updatedAt,
                        botRecording,
                        customerRecording,
                        recordingName
                    })
                })
                this.setState({ allCards })
            })

        console.log("snap1", this.state.allCards)
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
                        let fileName = id + "-" + Date.now().toString() + "-snippetRecording.mp3";
                        storage.ref(`snippet-recordings/${fileName}`).put(mergedMp3.blob).then(() => {
                            fire.firestore().collection('/conversation-snippets').doc(id).update({
                                snippetRecording: true,
                                recordingName: fileName
                            }).then(() => {
                                self.setState({ addCard: true })
                            })
                        })
                    })
                    .catch(error => {
                        throw new Error(error);
                    });
            })
        })
    }

    stitchRecordings = () => {
        var arr = [];
        var self = this;
        console.log("sas", this.state.allCards)
        // storage.ref().root.child('snippet-recordings').listAll().then((a) => {
        if (this.state.allCards) {
            this.state.allCards.map((card) => {
                storage.ref().child(`snippet-recordings/${card.recordingName}`).getDownloadURL().then(function (url) {
                    arr.push(url);
                    if (arr.length == self.state.allCards.length) {
                        let array1 = self.sortArray(arr);
                        self.audio
                            .fetchAudio(...array1)
                            .then(buffers => {
                                let mergedFiles = self.audio.concatAudio(buffers)
                                let mergedMp3 = self.audio.export(mergedFiles, "audio/mp3")
                                // self.audio.play(mergedMp3.blob)
                                storage.ref('final-recording/final-recording.mp3').put(mergedMp3.blob);
                            })
                            .catch(error => {
                                throw new Error(error);
                            });
                    }
                })
                    .catch(error => {
                        throw new Error(error);
                    });
            })
        }
        // });
    }

    sortArray = (arr) => {
        var map = new Map();
        arr.map((a) => {
            let r = a.split("-")
            // console.log("arr", r[4])
            map.set(a, r[4]);
        })
        let x = new Map([...map.entries()].sort((a, b) => {
            return a[1] - b[1];
        }));
        console.log("x", x);
        return Array.from(x.keys());
    }

    downloadRecording = () => {
        let self = this;

        // this.state.allCards.map((data) => {
        //   console.log("data", data.botTextInput);
        //   console.log("data", data.customerTextInput);
        // })

        storage.ref().child(`final-recording/final-recording.mp3`).getDownloadURL().then(function (url) {
            // self.audio.download(mergedMp3.blob)
            // var x = new Sound(url, 100, false)
            // console.log("ss", url.arrayBuffer());
            self.audio
                .fetchAudio(url)
                .then(buffers => {
                    let mergedFiles = self.audio.concatAudio(buffers)
                    let mergedMp3 = self.audio.export(mergedFiles, "audio/mp3")
                    // self.audio.play(mergedFiles)
                    self.audio.download(mergedMp3.blob, "final-recording")
                })
                .catch(error => {
                    throw new Error(error);
                });
        }).catch(error => {
            throw new Error(error);
        });
    }

    previewRecording = () => {
        // let self = this;
        // storage.ref().child(`final-recording/final-recording.mp3`).getDownloadURL().then(function (url) {
        //     self.setState({ url })
        // }).catch(error => {
        //     throw new Error(error);
        // });

        let self = this;

        storage.ref().child(`final-recording/final-recording.mp3`).getDownloadURL().then(function (url) {
            self.audio
                .fetchAudio(url)
                .then(buffers => {
                    let mergedFiles = self.audio.concatAudio(buffers)
                    self.audio.play(mergedFiles)
                })
                .catch(error => {
                    throw new Error(error);
                });
        }).catch(error => {
            throw new Error(error);
        });
    }

    render() {
        return (
            <div className="Dashboard">
                <div className="cards-container">
                    <Cardslist cards={this.state.allCards} />
                  
                </div>
                <div className="options-container">
                    <div className="options">
                        {this.state.addCard
                            ? <img src={addIcon}onClick={this.addConversation}/>
                            : null}
                            {/* <img src={addIcon}onClick={this.addConversation}/> */}
                            <img src={downloadIcon} onClick={this.stitchRecordings}/>
                            <img src={soundIcon} onClick={this.previewRecording}/>
                            <img src={downloadIcon} onClick={this.downloadRecording}/>
                        {/* <button onClick={this.stitchRecordings}>Listen</button>
                        <button onClick={this.previewRecording}>Preview</button>
                        <button onClick={this.downloadRecording}>Download</button> */}
                        {this.state.url
                            ? <audio controls>
                                <source src={this.state.url} type="audio/mpeg" />
                                    Your browser does not support the audio tag.
                           </audio>
                            : null
                        }
                    </div>
                </div>
            </div>
        );
    }
}

export default Dashboard;