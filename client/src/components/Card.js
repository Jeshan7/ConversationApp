import React, { Component } from "react";
import "../assets/css/Card.css";
import MicRecorder from "mic-recorder-to-mp3";
import { storage } from "../utils/firebaseConfig";
import fire from "../utils/firebaseConfig";
import { convertToMp3 } from "../utils/functions";
import Crunker from "crunker";
import sendButton from "../assets/icons/send.png";
import deleteButton from "../assets/icons/delete.png";
import { ToastContainer, toast, ToastType } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import customerIcon from "../assets/icons/customer.png";
import botIcon from "../assets/icons/bot.png";
import playIcon from "../assets/icons/play.png";
import pauseIcon from "../assets/icons/pause.png";

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
      conversationId: null,
    };
    (this.botAudio = null),
      (this.customerAudio = null),
      (this.finalAudio = null);
  }

  recorder = new MicRecorder({ bitRate: 128 });
  audio = new Crunker();

  recordBotStart = () => {
    if (
      !this.state.isRecording &&
      !this.state.isRecordingBot &&
      this.state.botTextInput
    ) {
      if (this.state.isBlocked) {
        toast.error("Permission Denied");
      } else {
        this.recorder
          .start()
          .then(() => {
            this.setState({ isRecordingBot: true, isRecording: true });
          })
          .catch((e) => {
            toast.info("Error occured while recording");
          });
      }
    } else {
      if (!this.state.customerTextInput) {
        toast.info("First enter text");
      } else {
        toast.info("Bot Audio is being recorded");
      }
    }
  };

  recordBotStop = () => {
    this.recorder
      .stop()
      .getMp3()
      .then(([buffer, blob]) => {
        this.setState({ isRecordingBot: false, isRecording: false });
        this.botAudio = buffer;
        toast.info("Recording Done");
      })
      .catch((e) => {
        toast.info("We could not retrieve your message");
        console.log(e);
      });
  };

  recordCustomerStart = () => {
    if (
      !this.state.isRecording &&
      !this.state.isRecordingCustomer &&
      this.state.customerTextInput
    ) {
      if (this.state.isBlocked) {
        toast.error("Permission Denied");
      } else {
        this.recorder
          .start()
          .then(() => {
            this.setState({ isRecordingCustomer: true, isRecording: true });
          })
          .catch((e) => {
            toast.info("Error occured while recording");
          });
      }
    } else {
      if (!this.state.customerTextInput) {
        toast.info("First enter text");
      } else {
        toast.info("Bot Audio is being recorded");
      }
    }
  };

  recordCustomerStop = () => {
    this.recorder
      .stop()
      .getMp3()
      .then(([buffer, blob]) => {
        this.setState({ isRecordingCustomer: false, isRecording: false });
        this.customerAudio = buffer;
        toast.info("Recording Done");
      })
      .catch((e) => {
        toast.info("We could not retrieve your message");
        console.log(e);
      });
  };

  deleteCard = () => {
    let index = this.props.index;
    let recordingName = this.props.data.recordingName;
    if (this.props.index) {
      fire
        .firestore()
        .collection("conversation-snippets")
        .doc(index)
        .delete()
        .then(() => {
          let fileName1 = index + "-bot-recording.mp3";
          let fileName2 = index + "-customer-recording.mp3";
          storage.ref().child(`bot-recordings/${fileName1}`).delete();
          storage.ref().child(`customer-recordings/${fileName2}`).delete();
          storage.ref().child(`snippet-recordings/${recordingName}`).delete();
        })
        .catch((err) => {
          console.log("error");
        });
    } else {
      toast.info("No Such File");
    }
  };

  handleTextInput = (param, e) => {
    if (param === "Bot") {
      this.setState({ botTextInput: e.target.value });
      this.botAudio = null;
      //   console.log("recording deleted as text has been changed");
    } else if (param === "Customer") {
      this.setState({ customerTextInput: e.target.value });
      this.customerAudio = null;
      //   console.log("recording deleted as text has been changed");
    }
  };

  uploadToDatabase = (recording, id, param) => {
    if (param === "Bot") {
      let fileName = id + "-" + "bot" + "-" + recording.name;
      storage.ref(`bot-recordings/${fileName}`).put(recording);
    } else {
      let fileName = id + "-" + "customer" + "-" + recording.name;
      storage.ref(`customer-recordings/${fileName}`).put(recording);
    }
  };

  sendData = (param) => {
    if (
      this.props.index === undefined &&
      ((this.botAudio && this.state.botTextInput) ||
        (this.customerAudio && this.state.customerTextInput))
    ) {
      fire
        .firestore()
        .collection("/conversation-snippets")
        .add({
          botTextInput: param === "Bot" ? this.state.botTextInput : null,
          customerTextInput:
            param === "Customer" ? this.state.customerTextInput : null,
          insertedAt: Date.now(),
          updatedAt: Date.now(),
          botRecording: false,
          customerRecording: false,
          snippetRecording: false,
          recordingName: null,
        })
        .then((snapshot) => {
          if (this.botAudio && this.state.botTextInput && param === "Bot") {
            this.uploadToDatabase(
              convertToMp3(this.botAudio),
              snapshot.id,
              "Bot"
            );
            fire
              .firestore()
              .collection("/conversation-snippets")
              .doc(snapshot.id)
              .update({
                botRecording: true,
                updatedAt: Date.now(),
              });
          } else if (
            this.botAudio &&
            this.state.customerTextInput &&
            param === "Customer"
          ) {
            this.uploadToDatabase(
              convertToMp3(this.customerAudio),
              snapshot.id,
              "Customer"
            );
            fire
              .firestore()
              .collection("/conversation-snippets")
              .doc(snapshot.id)
              .update({
                customerRecording: true,
                updatedAt: Date.now(),
              });
          }
        });
    } else {
      if (!this.props.data.botRecording && param === "Bot") {
        this.uploadToDatabase(
          convertToMp3(this.botAudio),
          this.props.index,
          "Bot"
        );
        fire
          .firestore()
          .collection("/conversation-snippets")
          .doc(this.props.index)
          .update({
            botRecording: true,
            botTextInput: this.state.botTextInput,
            updatedAt: Date.now(),
          })
          .then(() => {
            storage.ref().child(`final-recording/final-recording.mp3`).delete();
          });
      } else if (!this.props.data.customerRecording && param === "Customer") {
        this.uploadToDatabase(
          convertToMp3(this.customerAudio),
          this.props.index,
          "Customer"
        );
        fire
          .firestore()
          .collection("/conversation-snippets")
          .doc(this.props.index)
          .update({
            customerRecording: true,
            customerTextInput: this.state.customerTextInput,
            updatedAt: Date.now(),
          })
          .then(() => {
            storage.ref().child(`final-recording/final-recording.mp3`).delete();
          });
      } else if (this.props.index === undefined) {
        toast.info("No recording");
      }
    }
  };

  listenRecording = (param) => {
    if (param === "Bot" && this.botAudio) {
      let player = new Audio(URL.createObjectURL(convertToMp3(this.botAudio)));
      player.play();
    } else if (param === "Customer" && this.customerAudio) {
      let player = new Audio(
        URL.createObjectURL(convertToMp3(this.customerAudio))
      );
      player.play();
    } else {
      toast.info("No recording found");
    }
  };

  render() {
    return (
      <div className="Card">
        <ToastContainer position={toast.POSITION.TOP_LEFT} />
        <div className="input-container">
          {!this.props.data.botRecording ? (
            <div className="input-bot-container">
              <div className="input-audio-container">
                <div className="input-audio-bot">
                  {!this.state.isRecordingBot ? (
                    <img
                      src={playIcon}
                      width="25px"
                      height="25px"
                      onClick={this.recordBotStart}
                    />
                  ) : (
                    <img
                      src={pauseIcon}
                      width="25px"
                      height="25px"
                      onClick={this.recordBotStop}
                    />
                  )}
                </div>
                <button
                  className="btn-listen"
                  onClick={() => this.listenRecording("Bot")}
                >
                  Listen
                </button>
              </div>
              <div className="input-text-container">
                <div className="input-text">
                  <textarea
                    type="text"
                    onChange={(e) => this.handleTextInput("Bot", e)}
                    name="bot"
                    maxlength="100"
                  />
                </div>
                <img
                  src={sendButton}
                  width="25px"
                  height="25px"
                  onClick={() => this.sendData("Bot")}
                />
              </div>
            </div>
          ) : (
            <div className="message-bot-container">
              <div className="message">
                <div className="message-text">
                  {this.props.data.botTextInput}
                </div>
              </div>
            </div>
          )}
          {!this.props.data.customerRecording ? (
            <div className="input-customer-container">
              <div className="input-audio-container">
                <div className="input-audio-customer">
                  {!this.state.isRecordingCustomer ? (
                    <img
                      src={playIcon}
                      width="25px"
                      height="25px"
                      onClick={this.recordCustomerStart}
                    />
                  ) : (
                    <img
                      src={pauseIcon}
                      width="25px"
                      height="25px"
                      onClick={this.recordCustomerStop}
                    />
                  )}
                </div>
                <button
                  className="btn-listen"
                  onClick={() => this.listenRecording("Customer")}
                >
                  Listen
                </button>
              </div>
              <div className="input-text-container">
                <div className="input-text">
                  <textarea
                    type="text"
                    onChange={(e) => this.handleTextInput("Customer", e)}
                    name="customer"
                    maxlength="150"
                  />
                </div>
                <img
                  src={sendButton}
                  width="25px"
                  height="25px"
                  onClick={() => this.sendData("Customer")}
                />
              </div>
            </div>
          ) : (
            <div className="message-customer-container">
              <div className="message">
                <div className="message-text">
                  {this.props.data.customerTextInput}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="footer-container">
          <div className="bot-title">
            <div>
              <img src={botIcon} height="25px" width="25px" />
            </div>
          </div>
          <div className="delete-icon">
            {this.props.index ? (
              <img
                src={deleteButton}
                width="25px"
                height="25px"
                onClick={this.deleteCard}
              />
            ) : null}
          </div>
          <div className="customer-title">
            <div>
              <img src={customerIcon} height="25px" width="25px" />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Card;
