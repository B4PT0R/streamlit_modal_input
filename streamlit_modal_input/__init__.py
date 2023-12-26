import os
import json
import streamlit.components.v1 as components
import os
import firebase_admin
from firebase_admin import firestore, credentials
from datetime import datetime
from queue import Queue
import streamlit as st
_root_=os.path.dirname(os.path.abspath(__file__))

def root_join(*args):
    return os.path.join(_root_,*args)

_RELEASE = True

if not _RELEASE:
    _component_func = components.declare_component("streamlit_modal_input",url="http://localhost:3001")
else:
    parent_dir = os.path.dirname(os.path.abspath(__file__))
    build_dir = os.path.join(parent_dir, "frontend/build")
    _component_func = components.declare_component("streamlit_modal_input", path=build_dir)

class FirestoreListener:

    @staticmethod
    def firebase_app_is_initialized():
        try:
            firebase_admin.get_app()
        except:
            return False
        else:
            return True
        
    @staticmethod
    def firebase_init_app(cred):
        if FirestoreListener.firebase_app_is_initialized():
            pass
        else:
            cred_dict=dict(cred)
            with open(root_join('credentials.json'),'w') as f:
                json.dump(cred_dict,f)
            firebase_admin.initialize_app(credentials.Certificate(root_join('credentials.json')))
            os.remove(root_join('credentials.json'))

    #Firestore listener to implement the same thing when the app is served on streamlit's cloud 
    def __init__(self,credentials,collection,document):
        FirestoreListener.firebase_init_app(credentials)
        self.queue=Queue()
        self.last_Id=datetime.now().timestamp()
        self.doc = firestore.client().collection(collection).document(document)
        self.watch = None
        if not self.doc.get().exists:
            self.doc.set({'Id': self.last_Id, 'content': ''})

    def start_listening(self):

        # Create a callback on_snapshot function to capture changes
        def on_snapshot(doc_snapshot, changes, read_time):
            doc = doc_snapshot[0]
            message=doc.to_dict()
            Id=message.get("Id")
            if Id>self.last_Id:
                self.last_Id=Id
                self.queue.put(message.get("content"))
            
        # Watch the document
        self.watch=self.doc.on_snapshot(on_snapshot)

    def stop_listening(self):
        if self.watch:
            self.watch.unsubscribe()

    def delete_document(self):
        # Delete the Firestore document
        self.doc.delete()

    def get_message(self):
        return self.queue.get()
    
def modal_input(prompt='',firebase_credentials=None,firebase_config=None,key=None):

    if not key:
        key='modal_input'

    if not key+'_output' in st.session_state:
        st.session_state[key+'_output']=None

    if st.session_state[key+'_output'] is None:
        enabled=True
        value=''
    else:
        enabled=False
        value=st.session_state[key+'_output']

    firebase_credentials=firebase_credentials or dict(st.secrets["firebase_credentials"])
    firebase_config=firebase_config or dict(st.secrets["firebase_config"])

    collection="streamlit_modal_input"
    document=datetime.now().isoformat()

    _component_func(prompt=prompt,firebase_config=firebase_config,collection=collection,document=document,value=value,enabled=enabled,key=key,default=None)

    if enabled:
        listener=FirestoreListener(credentials=firebase_credentials,collection=collection,document=document)
        listener.start_listening()

        output=listener.get_message()

        listener.stop_listening()
        listener.delete_document()
        st.session_state[key+'_output']=output
    else:
        output=st.session_state[key+'_output']

    return output


if not _RELEASE:
    import streamlit as st

    firebase_credentials={
    }
    firebase_config={
    }

    text=modal_input("Enter text here",firebase_credentials=firebase_credentials,firebase_config=firebase_config)

    st.text(text)

    text=modal_input("Again...",firebase_credentials=firebase_credentials,firebase_config=firebase_config)

    st.text(text)




    
