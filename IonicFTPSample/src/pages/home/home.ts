import {Component, NgZone} from '@angular/core';
import { NavController } from 'ionic-angular';

// START
import { FileChooser } from '@ionic-native/file-chooser';
import { FTP } from '@ionic-native/ftp';
import { FilePath } from '@ionic-native/file-path';
import { File } from '@ionic-native/file';
import { AndroidPermissions } from '@ionic-native/android-permissions';

import { environment } from '../../configs/environment';
// END

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

	FTP_UPLOAD_PATH_NAME = environment.FTP_UPLOAD_PATH_NAME;
	FTP_HOST =  environment.FTP_HOST;
	FTP_USER = environment.FTP_USER;
	FTP_PASSWORD = environment.FTP_PASSWORD;
  FTP_DOWNLOAD_PATH = environment.FTP_DOWNLOAD_PATH;
  FTP_DOWNLOAD_FILE = environment.FTP_DOWNLOAD_FILE;
  DOWNLOAD_PATH = environment.DOWNLOAD_PATH;

	progress: number;
	connected: boolean;
	connecting: boolean;
  uploading: boolean;
  downloading: boolean;
  checking: boolean;
  not_found: boolean;

	logg: string = "";
  constructor(public navCtrl: NavController,
  	private zone: NgZone,
  	private fileChooser: FileChooser,
  	private ftp: FTP,
  	private filePath: FilePath,
    private file: File,
    private androidPermissions: AndroidPermissions) {
      this.storagePermissionCheck();
  }

  storagePermissionCheck(){
    this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.WRITE_EXTERNAL_STORAGE).then(
      result => {
        if(!result.hasPermission){
          this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.WRITE_EXTERNAL_STORAGE);
        }
      },
      err => {
        this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.WRITE_EXTERNAL_STORAGE);
      }
    );
  }

	openFileSelector(){
    this.fileChooser.open()
    .then(uri => this.log(uri))
    .catch((error: any) => this.log(JSON.stringify(error)));
  }

  connect(){
  	return this.ftp.connect(this.FTP_HOST, this.FTP_USER, this.FTP_PASSWORD);
  }

	connectButtonClicked(){
    this.log("Connect button clicked");
		this.connecting = true;
  	this.connect()
  	.then((res: any) => {
  		this.connecting = false;
  		this.connected = true;
  		this.log(res)
  	})
  	.catch((error: any) => {
  		this.connecting = false;
  		alert("Error" + JSON.stringify(error))
  		this.connected = false;
  		this.log(JSON.stringify(error));
  	});
  }

  disconnect(){
    return this.ftp.disconnect();
  }

  disconnectButtonClicked(){
    this.log("Disconnect button clicked");
    this.connected = false;
  	this.disconnect()
  	.then((res: any) => {
  		this.log(res);
  	})
  	.catch((error: any) => {
      this.log(JSON.stringify(error));
    });
  }

  upload(uri: any){
  	this.log(uri);
    this.uploading = true;
  	this.progress = 0;
  	let filename = uri.substring(uri.lastIndexOf('/')+1);
  	this.ftp.upload(uri, this.FTP_UPLOAD_PATH_NAME + filename)
    .subscribe((p: any) => {
			// added a zone just to make sure progress is updated realtime in UI
			this.zone.run(() => {
        this.progress = Math.round(p * 100);
	  		this.log("Upload progress " + this.progress);
	  		if(p == 1){
	  			this.log("Completed");
          this.uploading = false;
	  		}
      });
  	}, (error: any) => {
        this.log(JSON.stringify(error));
        this.uploading = false;
    });
  }

  uploadButtonClicked(){
  	if(this.connected){
	  	this.fileChooser.open()
	      .then(uri => {
	      	// need to convert application specific file URI to local file URI 
	      	this.filePath.resolveNativePath(uri)
						.then((filePath)=> {
							this.upload(filePath);
						})
            .catch((error: any) => this.log(JSON.stringify(error)));
	      })
	      .catch((error: any) => this.log(error));
	  } else {
	  	this.log("Not connected");
	  }
  }

  check_and_download(){
    this.checking = true;
    this.not_found = false;
    this.ftp.ls(this.FTP_DOWNLOAD_PATH)
    .then((list: any) => {
        let found = false;
        for(var i in list){
          if(list[i].name == this.FTP_DOWNLOAD_FILE) found = true;
        }

        //perform the download only if file exists
        if(found){
           this.download();
        }else{
          this.not_found = true;
          alert("File not found");
        }

        this.checking = false;
    })
    .catch((error: any) => {
      this.checking = false;
      alert(this.extract_ftp_errors(error));
      this.log(JSON.stringify(error));
    });
  }

  download(){
    this.downloading = true;
    this.progress = 0;
    let localPath = this.file.externalRootDirectory + this.DOWNLOAD_PATH + this.FTP_DOWNLOAD_FILE;
    this.ftp.download(localPath, this.FTP_DOWNLOAD_PATH + this.FTP_DOWNLOAD_FILE)
    .subscribe((p: any) => {
        // added a zone just to make sure progress is updated realtime in UI
        this.zone.run(() => {
          this.progress = Math.round(p * 100);
          this.log("Download progress " + this.progress);
          if(p == 1){
            this.log("Completed file " + localPath);
            this.downloading = false;
          }
        });
    }, (error: any) => {
        this.log(JSON.stringify(error));
        alert(this.extract_ftp_errors(error));
        this.downloading = false;
    });
  }

  downloadButtonClicked(){
    this.check_and_download();
  }

  log(e){
  	this.logg = this.logg + "\n" + e;
  	console.log(e);
  }

  extract_ftp_errors(str: string){
    let x = str.split("message=");
    if(x.length > 1){
      return x[1].replace("]", "");
    }
  }
}
