import React, { Component } from "react";
import "../assets/css/Dashboard.css";
import Cardslist from "../components/Cardslist";
import { storage } from "../utils/firebaseConfig";
import fire from "../utils/firebaseConfig";
import Crunker from "crunker";
import soundIcon from "../assets/icons/sound.png";
import downloadIcon from "../assets/icons/download.png";
import addIcon from "../assets/icons/add.png";
import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";
import Loader from "react-loader-spinner";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { saveAs } from "file-saver";
import stitchIcon from "../assets/icons/merge.png";

class Dashboard extends Component {
  state = {
    allCards: [],
    url: null,
    addCard: true,
    isLoading: false,
    isDownload: null,
  };

  audio = new Crunker();

  addConversation = () => {
    let newCard = {
      botTextInput: "",
      customerTextInput: "",
      insertedAt: null,
      updatedAt: null,
      botRecording: false,
      customerRecording: false,
      snippetRecording: false,
      recordingName: null,
    };

    let validation1 = this.state.allCards.every((data) => {
      return data.insertedAt !== null;
    });

    let validation2 = this.state.allCards.every((data) => {
      return data.botRecording && data.customerRecording;
    });

    if (validation1 && validation2) {
      let allCards = [...this.state.allCards, newCard];
      this.setState({ allCards });
    } else {
      toast.info("Recording already going on");
    }
  };

  componentDidMount = () => {
    this.fetchAllConversationCards();
  };

  fetchAllConversationCards = () => {
    fire
      .firestore()
      .collection("/conversation-snippets")
      .orderBy("updatedAt", "asc")
      .onSnapshot((snapshot) => {
        let querySnapshot = snapshot.docs;
        let allCards = [];
        querySnapshot.forEach((doc) => {
          let {
            insertedAt,
            updatedAt,
            botTextInput,
            customerTextInput,
            botRecording,
            customerRecording,
            snippetRecording,
            recordingName,
          } = doc.data();

          if (botRecording && customerRecording && !snippetRecording) {
            this.setState({ addCard: false, isLoading: true });
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
            recordingName,
          });
        });
        this.setState({ allCards });
      });
  };

  combineRecordings = (id) => {
    let botFileName = id + "-bot-recording.mp3";
    let customerFileName = id + "-customer-recording.mp3";
    var botUrl = null;
    var customerUrl = null;
    var self = this;
    storage
      .ref()
      .child(`bot-recordings/${botFileName}`)
      .getDownloadURL()
      .then(function (url) {
        botUrl = url;
        storage
          .ref()
          .child(`customer-recordings/${customerFileName}`)
          .getDownloadURL()
          .then(function (url) {
            customerUrl = url;
            self.audio
              .fetchAudio(botUrl, customerUrl)
              .then((buffers) => {
                let mergedFiles = self.audio.concatAudio(buffers);
                let mergedMp3 = self.audio.export(mergedFiles, "audio/mp3");
                let mergedFileName =
                  id + "-" + Date.now().toString() + "-snippetRecording.mp3";
                storage
                  .ref(`snippet-recordings/${mergedFileName}`)
                  .put(mergedMp3.blob)
                  .then(() => {
                    fire
                      .firestore()
                      .collection("/conversation-snippets")
                      .doc(id)
                      .update({
                        snippetRecording: true,
                        recordingName: mergedFileName,
                      })
                      .then(() => {
                        setTimeout(() => {
                          self.setState({ addCard: true, isLoading: false });
                        }, 3000);
                      });
                  });
              })
              .catch((error) => {
                throw new Error(error);
                self.setState({ isLoading: false });
              });
          });
      });
  };

  stitchRecordings = () => {
    var arr = [];
    this.setState({ isLoading: true });
    var self = this;
    if (this.state.allCards) {
      this.state.allCards.map((card) => {
        storage
          .ref()
          .child(`snippet-recordings/${card.recordingName}`)
          .getDownloadURL()
          .then(function (url) {
            arr.push(url);
            if (arr.length == self.state.allCards.length) {
              let array1 = self.sortArray(arr);
              self.audio
                .fetchAudio(...array1)
                .then((buffers) => {
                  let mergedFiles = self.audio.concatAudio(buffers);
                  let mergedMp3 = self.audio.export(mergedFiles, "audio/mp3");
                  storage
                    .ref("final-recording/final-recording.mp3")
                    .put(mergedMp3.blob);
                  setTimeout(() => {
                    self.setState({ isLoading: false });
                    toast.info("Audios has been stitched");
                  }, 6000);
                })
                .catch((error) => {
                  toast.error("Check that audio has been recorded");
                  self.setState({ isLoading: false });
                });
            }
          })
          .catch((error) => {
            toast.error("Check that audio has been recorded");
            self.setState({ isLoading: false });
          });
      });
    }
  };

  sortArray = (arr) => {
    var map = new Map();
    arr.map((value) => {
      let urlSplit = value.split("-");
      map.set(value, urlSplit[4]);
    });
    let newMap = new Map(
      [...map.entries()].sort((a, b) => {
        return a[1] - b[1];
      })
    );
    return Array.from(newMap.keys());
  };

  downloadRecording = () => {
    let self = this;
    storage
      .ref()
      .child(`final-recording/final-recording.mp3`)
      .getDownloadURL()
      .then(function (url) {
        self.audio
          .fetchAudio(url)
          .then((buffers) => {
            let mergedFiles = self.audio.concatAudio(buffers);
            let mergedMp3 = self.audio.export(mergedFiles, "audio/mp3");
            {
              self.state.allCards
                ? self.generateJSON(self.state.allCards)
                : null;
            }
            self.audio.download(mergedMp3.blob, "final-recording");
          })
          .catch((error) => {
            toast.error("Error while downloading");
          });
      })
      .catch((error) => {
        toast.error("Error while downloading");
      });
  };

  generateJSON = (paramArray) => {
    let arr = [];
    let obj = {};
    let bot = null;
    let customer = null;
    if (paramArray) {
      paramArray.map((data) => {
        bot = data.botTextInput;
        customer = data.customerTextInput;
        obj = { bot, customer };
        arr.push(obj);
      });
    }
    let data = JSON.stringify(arr);
    var blob = new Blob([data], {
      type: "text/json;charset=utf-8;",
    });

    saveAs(blob, "final-conversation.json");
  };

  previewRecording = () => {
    this.setState({ isLoading: true });
    let self = this;
    storage
      .ref()
      .child(`final-recording/final-recording.mp3`)
      .getDownloadURL()
      .then(function (url) {
        self.audio
          .fetchAudio(url)
          .then((buffers) => {
            let mergedFiles = self.audio.concatAudio(buffers);
            self.audio.play(mergedFiles);
            self.setState({ isLoading: false });
          })
          .catch((error) => {
            self.setState({ isLoading: false });
          });
      })
      .catch((error) => {
        self.setState({ isLoading: false });
      });
  };

  render() {
    return (
      <div className="Dashboard">
        <ToastContainer position={toast.POSITION.TOP_LEFT} />
        <div className="cards-container">
          <Cardslist cards={this.state.allCards} />
        </div>
        <div className="options-container">
          {!this.state.isLoading ? (
            <div className="options-box">
              <div className="options">
                <img
                  src={addIcon}
                  width="25px"
                  height="25px"
                  onClick={this.addConversation}
                />
              </div>
              <div className="options">
                <img
                  src={stitchIcon}
                  width="25px"
                  height="25px"
                  onClick={this.stitchRecordings}
                />
              </div>
              <div className="options">
                <img
                  src={soundIcon}
                  width="25px"
                  height="25px"
                  onClick={this.previewRecording}
                />
              </div>
              <div className="options">
                <img
                  src={downloadIcon}
                  width="25px"
                  height="25px"
                  onClick={this.downloadRecording}
                />
              </div>
            </div>
          ) : (
            <Loader type="Rings" color="#0da6ad" height={80} width={80} />
          )}
        </div>
      </div>
    );
  }
}

export default Dashboard;
