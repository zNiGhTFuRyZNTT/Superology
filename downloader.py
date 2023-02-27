import requests
import re
import pandas as pd
from os import listdir
from os.path import isfile, join

class Program:
    def __init__(self, filename : str, path : str):
        self.filename = filename
        self.path = path
        self.urls = []
        self.count = 0
    
    def get_urls(self):
        return self.urls
    
    def _extract_urls(self):
        with open(self.filename, 'r') as f:
            text = f.readlines()
            for line in text:
                link_regex = "(?P<url>https?://[^\s]+)"
                url = re.findall(link_regex, line)
                self.urls.append(url[0]) if len(url) > 0 else ...
        print("[>] Finished extracting.")
                
    def init_download(self):
        if len(self.urls) == 0: raise ValueError("[>] No URLs found, extract urls then run this."); return
        for url in self.urls:
            filename = url.split('/')[-1]
            print(f"Downloading: {filename} ...")
            try:
                r = requests.get(url, stream = True)
                with open(f"{self.path}/{filename}", 'wb') as f: 
                    for chunk in r.iter_content(chunk_size = 1024*1024): 
                        if chunk: 
                            f.write(chunk) 
            except Exception as e:
                print(e)
                print("Downloading: {filename} failed, skipping ...")
                input("Press Enter to continue...")
                continue
            
            self.count += 1
            print( "%s downloaded!\n")
            
            

if __name__ == '__main__':
    def listFiles(dir):
        files = [f for f in listdir(dir) if isfile(join(dir, f))]
        return files
    # #< -- Single file download -- >
    # todo = 'tiktok'
    # app = Program(f"urls/{todo}.txt", f"videos/{todo}")
    # app._extract_urls()
    # app.init_download()
    
    #< -- full Download -- >
    files = listFiles('assets/urls')
    for file in files:
        print(file)
        print(f"assets/videos/{file.split('.')[0]}")
        app = Program(f"assets/urls/{file}", f"assets/videos/{file.split('.')[0]}")
        app._extract_urls()
        app.init_download()