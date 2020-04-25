import React, { Component } from 'react';
import '../assets/css/Card.css';
import MicRecorder from 'mic-recorder-to-mp3';
import { storage } from '../utils/firebaseConfig';

class Card extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isRecordingBot: false,
            isRecordingCustomer: false,
            isBlocked: false,
        }
        this.botAudio = null,
            this.customerAudio = null,
            this.finalAudio = null
    }

    recorder = new MicRecorder({ bitRate: 128 })

    recordBotStart = () => {
        console.log("ass", this.botAudio)
        if (this.state.isBlocked) {
            console.log("Permission denied");
        } else {
            this.recorder.start().then(() => {
                this.setState({ isRecordingBot: true })
                console.log("Recording started")
            }).catch((e) => {
                console.error(e);
            });
        }
    }

    recordBotStop = () => {
        this.recorder.stop().getMp3().then(([buffer, blob]) => {
            this.setState({ isRecordingBot: false })
            console.log("sa", blob)
            const file = new File(buffer, 'audio.mp3', {
                type: blob.type,
                lastModified: Date.now()
            });
            const player = new Audio(URL.createObjectURL(file));
            this.botAudio = buffer;
            player.controls = true;
            player.play();
        }).catch((e) => {
            alert('We could not retrieve your message');
            console.log(e);
        });
    }

    recordCustomerStart = () => {
        if (this.state.isBlocked) {
            console.log("Permission denied");
        } else {
            this.recorder.start().then(() => {
                this.setState({ isRecordingCustomer: true })
                console.log("Recording started")
            }).catch((e) => {
                console.error(e);
            });
        }
    }

    recordCustomerStop = () => {
        this.recorder.stop().getMp3().then(([buffer, blob]) => {
            this.setState({ isRecordingCustomer: false })
            console.log("buffer", buffer)
            const file = new File(buffer, 'audio.mp3', {
                type: blob.type,
                lastModified: Date.now()
            });

            const player = new Audio(URL.createObjectURL(file));
            
            this.customerAudio = buffer;
            player.controls = true;
            player.play();
            
        }).catch((e) => {
            alert('We could not retrieve your message');
            console.log(e);
        });
    }

    combineAudio = () => {
        if (this.botAudio && this.customerAudio) {
            var x = this.botAudio.concat(this.customerAudio)
            const file = new File(x, 'audio.mp3', {
                type: "audio/mp3",
                lastModified: Date.now()
            });
            this.finalAudio = file;
            
            const player = new Audio(URL.createObjectURL(file));
        } else {
            console.log("No Recording")
        }
    }

    uploadAudio = () => {
        if (this.finalAudio) {
            storage.ref(`audio/${this.finalAudio.name}`).put(this.finalAudio);
        } else {
            console.log("no file")
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
                        </div>
                        <div className="input-text-bot">
                            <textarea type="text" name="bot" />
                        </div>
                    </div>
                    <div className="input-customer-container">
                        <div className="input-audio-customer">
                            {!this.state.isRecordingCustomer
                                ? <i className="far fa-play-circle fa-5x" onClick={this.recordCustomerStart}></i>
                                : <i className="far fa-stop-circle fa-5x" onClick={this.recordCustomerStop}></i>}
                        </div>
                        <div className="input-text-customer">
                            <textarea type="text" name="customer" />
                        </div>
                    </div>
                </div>
                <div>

                    <button onClick={this.combineAudio}>Combine</button>
                    <button onClick={this.uploadAudio}>Upload</button>
                </div>
            </div>
        );
    }
}

export default Card;