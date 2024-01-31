from pathlib import Path

import setuptools

this_directory = Path(__file__).parent
long_description = (this_directory / "README.md").read_text()

setuptools.setup(
    name="streamlit_modal_input",
    version="0.0.7",
    author="Baptiste Ferrand",
    author_email="bferrand.math@gmail.com",
    description="Modal text input component for Streamlit",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/B4PT0R/streamlit_modal_input",
    packages=setuptools.find_packages(),
    include_package_data=True,
    classifiers=[],
    python_requires=">=3.7",
    install_requires=[
        # By definition, a Custom Component depends on Streamlit.
        # If your component has other Python dependencies, list
        # them here.
        "streamlit >= 0.63",
        "firebase-admin >= 6.2.0"
    ],
)
