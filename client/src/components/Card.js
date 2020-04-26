import React, { Component } from 'react';
import '../assets/css/Card.css';
import MicRecorder from 'mic-recorder-to-mp3';
import { storage } from '../utils/firebaseConfig';
import fire from '../utils/firebaseConfig';
import { convertToMp3 } from '../utils/functions';
import Crunker from 'crunker';

class Card extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isRecordingBot: false,
            isRecordingCustomer: false,
            isBlocked: false,
            isRecording: false,
            botTextInput: null,
            customerTextInput: null,
            conversationId: null
        }
        this.botAudio = null,
            this.customerAudio = null,
            this.finalAudio = null

    }

    recorder = new MicRecorder({ bitRate: 128 });
    audio = new Crunker();

    recordBotStart = () => {
        if (!this.state.isRecording && !this.state.isRecordingBot) {
            if (this.state.isBlocked) {
                console.log("Permission denied");
            } else {
                this.recorder.start().then(() => {
                    this.setState({ isRecordingBot: true, isRecording: true })
                    console.log("Recording started")
                }).catch((e) => {
                    console.error(e);
                });
            }
        } else {
            console.log("already recording")
        }
        // console.log(this.state.isRecording , " ", this.state.isRecordingBot)
    }

    recordBotStop = () => {
        this.recorder.stop().getMp3().then(([buffer, blob]) => {
            this.setState({ isRecordingBot: false, isRecording: false });
            this.botAudio = buffer;
            // this.uploadToDatabase(this.botAudio)
        }).catch((e) => {
            alert('We could not retrieve your message');
            console.log(e);
        });
    }

    recordCustomerStart = () => {
        if (!this.state.isRecording && !this.state.isRecordingCustomer) {
            if (this.state.isBlocked) {
                console.log("Permission denied");
            } else {
                this.recorder.start().then(() => {
                    this.setState({ isRecordingCustomer: true, isRecording: true })
                    console.log("Recording started")
                }).catch((e) => {
                    console.error(e);
                });
            }
        } else {
            console.log("already recording")
        }
    }

    recordCustomerStop = () => {
        this.recorder.stop().getMp3().then(([buffer, blob]) => {
            this.setState({ isRecordingCustomer: false, isRecording: false })
            this.customerAudio = buffer;
            // this.uploadToDatabase(this.customerAudio)
        }).catch((e) => {
            alert('We could not retrieve your message');
            console.log(e);
        });
    }

    combineAudio = () => {
        if (this.botAudio && this.customerAudio) {
            let finalRecording = this.botAudio.concat(this.customerAudio)
            this.finalAudio = convertToMp3(finalRecording);
        } else {
            console.log("No Recording")
        }
    }

    uploadAudio = () => {
        if (this.finalAudio) {
            // this.uploadToDatabase(this.finalAudio)
            let fileName = this.props.index + "-" + this.finalAudio.name;
            storage.ref(`audio/${fileName}`).put(this.finalAudio);

            fire
                .firestore()
                .collection("conversation-snippets")
                .doc(this.props.index)
                .update({
                    botTextInput: this.state.botTextInput,
                    customerTextInput: this.state.customerTextInput
                })
            console.log("done")
        } else {
            console.log("no file")
        }
    }

    deleteCard = () => {
        var a = this.props.index;
        fire
            .firestore()
            .collection('conversation-snippets')
            .doc(a)
            .delete()
            .then(() => {
                let fileName1 = a + "-bot-recording.mp3";

                storage.ref().child(`bot-recordings/${fileName1}`).delete().then(function () {
                    let fileName2 = a + "-customer-recording.mp3";
                    console.log("filename", fileName2)
                    storage.ref().child(`customer-recordings/${fileName2}`).delete().then(function () {
                        let fileName3 = a + "-snippet-recording.mp3";
                        storage.ref().child(`snippet-recordings/${fileName3}`).delete().then(function () {
                            console.log("Deletedeleted")
                        }).catch(function (error) {
                            console.log('error occured')
                        });
                    }).catch(function (error) {
                        console.log('error occured')
                    });
                }).catch(function (error) {
                    console.log('error occured')
                });
            }).catch((err) => {
                console.log("error")
            })
    }

    downloadRecording = (id) => {
        let self = this;
        let fileName = id + "-bot-recording.mp3";
        storage.ref().child(`audio/${fileName}`).getDownloadURL().then(function (url) {
            console.log("aa", url)
            self.audio
                .fetchAudio('https://firebasestorage.googleapis.com/v0/b/fir-practice-13d0a.appspot.com/o/audio%2F0FXs4HK2HTzWHd64tH10-bot-recording.mp3?alt=media&token=505dab3b-bb5f-4075-92f9-985d4650d1b2'
                    , 'https://firebasestorage.googleapis.com/v0/b/fir-practice-13d0a.appspot.com/o/audio%2FRpTL23167Ljz9ATqxw4A-bot-recording.mp3?alt=media&token=10dba5e8-0066-4495-bde0-b5d9a315b979')
                .then(buffers => {
                    console.log("buffer", buffers)
                    var a = self.audio.concatAudio(buffers)
                    console.log("1", a)
                    let x = self.audio.export(a, "audio/mp3")
                    console.log("2", x)
                    let z = self.audio.download(x.blob)
                    console.log("3", z);


                })
                .catch(error => {
                    throw new Error(error);
                });
        })
    }

    playRecording = () => {
        if (this.finalAudio) {
            let player = new Audio(URL.createObjectURL(this.finalAudio));
            player.play();
        }
    }

    listenRecording = (param) => {
        if (param === "Bot" && this.botAudio) {
            let player = new Audio(URL.createObjectURL(convertToMp3(this.botAudio)));
            player.play();
        } else if (param === "Customer" && this.customerAudio) {
            let player = new Audio(URL.createObjectURL(convertToMp3(this.customerAudio)));
            player.play();
        } else {
            console.log("no recording found");
        }
    }

    handleTextInput = (param, e) => {
        if (param === "Bot") {
            this.setState({ botTextInput: e.target.value })
            this.botAudio = null;
            console.log("recording deleted as text has been changed")
        } else if (param === "Customer") {
            this.setState({ customerTextInput: e.target.value })
            this.customerAudio = null;
            console.log("recording deleted as text has been changed")
        }
    }

    uploadToDatabase = (recording, id, param) => {
        console.log(id, "asasas", param, recording)
        if (param === "Bot") {
            let fileName = id + "-" + "bot" + "-" + recording.name;
            storage.ref(`bot-recordings/${fileName}`).put(recording);
            console.log("done")
        } else {
            let fileName = id + "-" + "customer" + "-" + recording.name;
            storage.ref(`customer-recordings/${fileName}`).put(recording);
            console.log("done")
        }
    }

    sendData = (param) => {
        if (this.props.index === undefined
            && ((this.botAudio && this.state.botTextInput)
                || (this.customerAudio && this.state.customerTextInput))) {
            fire.firestore().collection('/conversation-snippets').add({
                botTextInput: this.state.botTextInput,
                customerTextInput: this.state.customerTextInput,
                insertedAt: Date.now(),
                updatedAt: Date.now(),
                botRecording: false,
                customerRecording: false
            }).then((snapshot) => {
                if (this.botAudio && param === "Bot") {
                    this.uploadToDatabase(convertToMp3(this.botAudio), snapshot.id, "Bot")
                    fire.firestore().collection('/conversation-snippets').doc(snapshot.id).update({
                        botRecording: true
                    })
                } else {
                    this.uploadToDatabase(convertToMp3(this.customerAudio), snapshot.id, "Customer")
                    fire.firestore().collection('/conversation-snippets').doc(snapshot.id).update({
                        customerRecording: true
                    })
                }
            })
        } else {
            if (!this.props.data.botRecording && param === "Bot") {
                this.uploadToDatabase(convertToMp3(this.botAudio), this.props.index, "Bot")
                fire.firestore().collection('/conversation-snippets').doc(this.props.index).update({
                    botRecording: true,
                    botTextInput: this.state.botTextInput
                })
            } else if (!this.props.data.customerRecording && param === "Customer") {
                this.uploadToDatabase(convertToMp3(this.customerAudio), this.props.index, "Customer")
                fire.firestore().collection('/conversation-snippets').doc(this.props.index).update({
                    customerRecording: true,
                    customerTextInput: this.state.customerTextInput
                })
            } else {
                console.log("no recording")
            }
        }
    }

    render() {
        return (
            <div className="Card" >
                <div className="input-container">
                    <div className="input-bot-container">
                        <div className="input-audio-bot">
                            {!this.state.isRecordingBot
                                ? <i className="far fa-play-circle fa-5x" onClick={this.recordBotStart}></i>
                                : <i className="far fa-stop-circle fa-5x" onClick={this.recordBotStop}></i>}
                            <button onClick={() => this.listenRecording("Bot")}>Listen</button>
                            <button onClick={() => this.sendData("Bot")}>Send</button>
                        </div>
                        <div className="input-text-bot">
                            {!this.props.data.botTextInput
                                ? <input type="text"
                                    onChange={(e) => this.handleTextInput("Bot", e)}
                                    name="bot" />
                                : <p>{this.props.data.botTextInput}</p>}
                        </div>
                    </div>
                    <div className="input-customer-container">
                        <div className="input-audio-customer">
                            {!this.state.isRecordingCustomer
                                ? <i className="far fa-play-circle fa-5x" onClick={this.recordCustomerStart}></i>
                                : <i className="far fa-stop-circle fa-5x" onClick={this.recordCustomerStop}></i>}
                            <button onClick={() => this.listenRecording("Customer")}>Listen</button>
                            <button onClick={() => this.sendData("Customer")}>Send</button>
                        </div>
                        <div className="input-text-customer">
                            {!this.props.data.customerTextInput
                                ? <input type="text"
                                    onChange={(e) => this.handleTextInput("Customer", e)}
                                    name="customer" />
                                : <p>{this.props.data.customerTextInput}</p>}
                        </div>
                    </div>
                </div>
                <div>

                    {/* <button onClick={this.combineAudio}>Combine</button> */}
                    {/* <button onClick={this.uploadAudio}>Upload</button> */}
                    <button onClick={this.deleteCard}>Delete</button>
                    {/* <button onClick={this.playRecording}>Play</button>
                    <button onClick={() => this.downloadRecording(this.props.index)}>Download</button> */}
                </div>
            </div>
        );
    }
}

export default Card;
