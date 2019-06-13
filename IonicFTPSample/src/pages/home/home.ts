import {Component, NgZone} from '@angular/core';
import { NavController } from 'ionic-angular';

// START
import { FileChooser } from '@ionic-native/file-chooser';
import { FTP } from '@ionic-native/ftp';
import { FilePath } from '@ionic-native/file-path';
import { File } from '@ionic-native/file';
import { AndroidPermissions } from '@ionic-native/android-permissions';


// END

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

	FTP_UPLOAD_PATH_NAME="/m/"
	FTP_HOST="ftp.dlptest.com:21"
	FTP_USER="dlpuser@dlptest.com"
	FTP_PASSWORD="fLDScD4Ynth0p4OJ6bW6qCxjh"
  FTP_DOWNLOAD_PATH="/m/"
  FTP_DOWNLOAD_FILE="test"
  DOWNLOAD_PATH=""

	progress: number;
	connected: boolean;
	connecting: boolean;
	logg: string;
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
      .catch(e => this.log(e));
  }

  connect(){
  	return this.ftp.connect(this.FTP_HOST, this.FTP_USER, this.FTP_PASSWORD);
  }

	connectButtonClicked(){
		this.connecting = true;
  	this.connect()
  	.then((res: any) => {
  		this.connecting = false;
  		this.connected = true;
  		this.log(res)
  	})
  	.catch((error: any) => {
  		this.connecting = false;
  		alert("error" + JSON.stringify(error))
  		this.connected = false;
  		this.log(error)
  	});
  }

  disconnect(){
    this.connected = false;
  	this.ftp.disconnect()
  	.then((res: any) => {
  		this.log(res)
  	})
  	.catch((error: any) => {
  		alert("error")
  		this.log(error)
  	});
  }

  upload(uri: any){
  	this.log(uri);
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
		  		}
        });
  	}, err => {
        this.log(JSON.stringify(err));
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
						}).catch((err) => {
							this.log(JSON.stringify(err));
						});
	      })
	      .catch(e => this.log(e));
	  } else {
	  	this.log("Not connected");
	  }
  }

  download(){
    this.progress = 0;
    let localPath = this.file.externalRootDirectory + "/" + this.FTP_DOWNLOAD_FILE;
    this.ftp.download(localPath, this.FTP_DOWNLOAD_PATH + "/" + this.FTP_DOWNLOAD_FILE)
    .subscribe((p: any) => {
        // added a zone just to make sure progress is updated realtime in UI
        this.zone.run(() => {
          this.progress = Math.round(p * 100);
          this.log("Download progress " + this.progress);
          if(p == 1){
            this.log("Completed file " + localPath);
          }
        });
    }, err => {
        this.log(JSON.stringify(err));
    });
  }

  downloadButtonClicked(){


    this.download();
  }

  log(e){
  	this.logg = this.logg + "\n" + e;
  	console.log(e);
  }
}
