import React from "react";
import { Streamlit, StreamlitComponentBase, withStreamlitConnection } from "streamlit-component-lib";
import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, signInWithCustomToken } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import tinycolor from 'tinycolor2'
import './App.css';

interface State {
  inputText: string;
  isAuthenticated: boolean;
  firebaseApp:FirebaseApp | null;
  enabled: boolean;
  hasFocus: boolean;
}

class ModalInput extends StreamlitComponentBase<State> {

    private inputRef: React.RefObject<HTMLInputElement>;

    constructor(props:any) {
        super(props);
        // Initialize the ref
        this.inputRef = React.createRef<HTMLInputElement>();
    }

    public state = {
        inputText: "",
        isAuthenticated:false,
        firebaseApp: null,
        enabled: false,
        hasFocus: false,
    };

    componentDidMount() {
        if (!this.state.isAuthenticated && this.props.args["firebase_config"]) {
            const app=initializeApp(this.props.args["firebase_config"]);
            const auth=getAuth(app);
            signInWithCustomToken(auth, this.props.args['idToken'])
            .then(() => {
                // Authentication successful
                this.setState({ isAuthenticated: true, firebaseApp:app });
            })
            .catch(error => {
                console.error("Error authenticating with Firebase: ", error);
                this.setState({ isAuthenticated: false, firebaseApp: null });
                // Handle authentication failure (e.g., show error message)
            });
        } 

        if (this.inputRef.current) {
            this.inputRef.current.focus();
        }
        this.setState({enabled:this.props.args["enabled"],inputText:this.props.args["value"]})
    }

    handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({ inputText: event.target.value });
    };

    handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        // Check if Enter is pressed
        if (event.key === 'Enter') {
          this.handleSubmit();
        }
    };

    handleSubmit = async () => {
        const firestoreCollection=this.props.args["collection"];
        const firestoreDocument = this.props.args["document"];
        
        if (this.state.firebaseApp && this.state.isAuthenticated) {
            const db = getFirestore(this.state.firebaseApp);
            const inputRef = doc(db, firestoreCollection, firestoreDocument);
            const output={
                content: this.state.inputText,
                Id: Math.floor(Date.now() / 1000)
            };
            try {
                await setDoc(inputRef, output);
                this.setState({ enabled: false });
                Streamlit.setComponentValue(this.state.inputText);
            } catch (error) {
                console.error("Error writing to Firestore: ", error);
            }
        } else {
            console.error("Firebase App is not initialized or not properly authenticated");
        }
      };

    private TextInputStyle = (Theme:any):any => {
        const Height=21
        const baseBorderColor = tinycolor.mix(Theme.textColor, Theme.backgroundColor, 80).lighten(2).toString();
        const backgroundColor = tinycolor.mix(Theme.textColor, tinycolor.mix(Theme.primaryColor, Theme.backgroundColor, 99), 99).lighten(0.5).toString();
        const textColor = Theme.textColor;
        const borderColor = this.state.hasFocus && this.state.enabled ? Theme.primaryColor : baseBorderColor
        const padding=12;
        
        return {
            height: `${Height+2*padding}px`,
            borderColor: borderColor,
            backgroundColor: backgroundColor,
            color: textColor,
            whiteSpace: 'pre',
            overflowX: 'auto',
            resize:"none",
            width: 'calc(100% - 6px)',
            margin: '3px',
            outline: 'none',
            fontFamily: "monospace",
            padding:`${padding}px 6px`
        };
    };

    public render = (): React.ReactNode => {
        const Theme = this.props.theme ?? {
            base: 'dark',
            backgroundColor: 'black',
            secondaryBackgroundColor: 'grey',
            primaryColor: 'red',
            textColor: 'white'
          };
        Streamlit.setComponentValue(this.state.inputText)
        return (
            <div className="modal-input">
            <input
                className="mytextinput"
                ref={this.inputRef}
                type="text"
                value={this.state.inputText}
                placeholder={this.props.args["prompt"]}
                onChange={this.handleInputChange}
                onKeyDown={this.handleKeyDown}
                disabled={!this.state.enabled}
                style={this.TextInputStyle(Theme)}
                onFocus={() => this.setState({ hasFocus: true })}
                onBlur={() => this.setState({ hasFocus: false })}
            />
            </div>
        );
    };
}

export default withStreamlitConnection(ModalInput);
