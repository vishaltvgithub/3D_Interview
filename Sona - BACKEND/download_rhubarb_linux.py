import os
import zipfile
import requests

def download_rhubarb_linux():
    url = "https://github.com/DanielSWolf/rhubarb-lip-sync/releases/download/v1.13.0/rhubarb-lip-sync-1.13.0-linux.zip"
    save_path = "rhubarb_linux.zip"
    extract_to = "bin/rhubarb/rhubarb-lip-sync-1.13.0-linux"

    if not os.path.exists("bin/rhubarb"):
        os.makedirs("bin/rhubarb")

    print(f"Downloading Rhubarb Linux binary from {url}...")
    response = requests.get(url)
    with open(save_path, "wb") as f:
        f.write(response.content)

    print(f"Extracting to {extract_to}...")
    with zipfile.ZipFile(save_path, "r") as zip_ref:
        zip_ref.extractall(extract_to)

    os.remove(save_path)
    print("Download and extraction complete. You can now commit the 'bin/rhubarb' folder to your repository.")

if __name__ == "__main__":
    download_rhubarb_linux()
