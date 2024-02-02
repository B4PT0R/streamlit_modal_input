import React from "react";
import { StreamlitComponentBase, withStreamlitConnection } from "streamlit-component-lib";
import axios from 'axios';
import tinycolor from 'tinycolor2'
import './App.css';

interface State {
  inputText: string;
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
        enabled: false,
        hasFocus: false,
    };

    componentDidMount() {

        console.log('Component did mount.')

        if (this.inputRef.current) {
            this.inputRef.current.focus();
        }

        this.setState({ enabled: this.props.args['enabled'], inputText: this.props.args['value'] });
    }

    handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({ inputText: event.target.value });
    };

    handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            this.handleSubmit();
        }
    };

    handleSubmit = async () => {
        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${this.props.args['projectId']}/databases/(default)/documents/${this.props.args['collection']}/${this.props.args['document']}`;
        const idToken = this.props.args['idToken'];
        
        const output = {
            fields: {
                content: { stringValue: this.state.inputText },
                Id: { integerValue: Math.floor(Date.now() / 1000).toString() }
            }
        };

        const headers = {
            Authorization: `Bearer ${idToken}`,
            'Content-Type': 'application/json',
        };

        try {
            await axios.patch(firestoreUrl, output, { headers });
            this.setState({ enabled: false });
        } catch (error) {
            console.error("Error writing to Firestore: ", error);
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
