import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

// START
import { FileChooser } from '@ionic-native/file-chooser';
import { FTP } from '@ionic-native/ftp';

// END

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

	connected: boolean;
  constructor(public navCtrl: NavController,
  	private fileChooser: FileChooser,
  	private ftp: FTP) {}

	openFileSelector(){
    this.fileChooser.open()
      .then(uri => this.log(uri))
      .catch(e => this.log(e));
  }

  connect(){
  	this.ftp.connect('ftp://ftp.dlptest.com/', 'dlpuser@dlptest.com', 'fLDScD4Ynth0p4OJ6bW6qCxjh')
  	.then((res: any) => {
  		this.connected = true;
  		this.log(res)
  	})
  	.catch((error: any) => {
  		alert("error")
  		this.connected = false;
  		this.log(error)
  	});
  }


  disconnect(){
  	this.ftp.disconnect()
  	.then((res: any) => {
  		this.connected = false;
  		this.log(res)
  	})
  	.catch((error: any) => {
  		alert("error")
  		this.log(error)
  	});
  }

  log(e){
  	console.log(e);
  }
}
