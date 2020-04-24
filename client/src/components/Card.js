import React, { Component } from 'react';
import '../assets/css/Card.css';
import MicRecorder from 'mic-recorder-to-mp3';

class Card extends Component {
    state = {
        isRecording: false,
        isBlocked: false,
        player: null
    }

    recorder = new MicRecorder({ bitRate: 128 })

    handlePlay = () => {
        if (this.state.isBlocked) {
            console.log("Permission denied");
        } else {
            this.recorder.start().then(() => {
                this.setState({ isRecording: true })
                console.log("Recording started")
            }).catch((e) => {
                console.error(e);
            });
        }
    }

    handleStop = () => {
        this.recorder.stop().getMp3().then(([buffer, blob]) => {
            this.setState({ isRecording: false })
            const file = new File(buffer, 'me-at-thevoice.mp3', {
                type: blob.type,
                lastModified: Date.now()
            });

            player;
            const player = new Audio(URL.createObjectURL(file));
            player.controls = true;
            console.log("asss", player.controls)


        }).catch((e) => {
            alert('We could not retrieve your message');
            console.log(e);
        });
    }
    render() {
        return (
            <div className="Card" >
                <div className="input-container">
                    <div className="input-bot-container">
                        <div className="input-audio-bot">
                            {!this.state.isRecording
                                ? <i className="far fa-play-circle fa-5x" onClick={this.handlePlay}></i>
                                : <i className="far fa-stop-circle fa-5x" onClick={this.handleStop}></i>}
                        </div>
                        <div className="input-text-bot">
                            <textarea type="text" name="bot" />
                        </div>
                    </div>
                    <div className="input-customer-container">
                        <div className="input-audio-customer">
                            {/* <i className="far fa-play-circle fa-5x"></i> */}
                            <i className="far fa-stop-circle fa-5x"></i>
                        </div>
                        <div className="input-text-customer">
                            <textarea type="text" name="customer" />
                        </div>
                    </div>
                </div>
                <div></div>
            </div>
        );
    }
}

export default Card;