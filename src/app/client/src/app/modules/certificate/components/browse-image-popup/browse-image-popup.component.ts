import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { UploadCertificateService } from '../../services/upload-certificate/upload-certificate.service';
import { ToasterService, ResourceService } from '@sunbird/shared';
import * as _ from 'lodash-es';
import { UserService } from '@sunbird/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';


@Component({
  selector: 'browse-image-popup',
  templateUrl: './browse-image-popup.component.html',
  styleUrls: ['./browse-image-popup.component.scss']
})
export class BrowseImagePopupComponent implements OnInit {

  @Input() showSelectImageModal = false;
  @Input() logoType;
  @Output() assetData = new EventEmitter();
  @Output() close = new EventEmitter();
  showUploadUserModal;
  imageName;
  imagesList = [];
  uploadForm: FormGroup;
  fileObj: any;
  selectedLogo: any;
  imageDimensions = {
    'LOGO': { type: 'PNG', dimensions: '88px X 88px' },
    'SIGN': { type: 'PNG', dimensions: '112px X46px' }
  };

  constructor(public uploadCertificateService: UploadCertificateService,
    public toasterService: ToasterService,
    public resourceService: ResourceService,
    public userService: UserService) {
    this.uploadForm = new FormGroup({
      assetCaption: new FormControl('', [Validators.required]),
      creator: new FormControl('', [Validators.required]),
      creatorId: new FormControl('', [Validators.required])
    });
  }

  ngOnInit() {
    this.uploadCertificateService.getAssetData().subscribe(res => {
      this.imagesList = res.result.content;
    }, error => {
      this.toasterService.error(_.get(this.resourceService, 'messages.fmsg.m0004'));
    });
  }

  searchImage() {
    this.uploadCertificateService.getAssetData(this.imageName).subscribe(res => {
      if (res && res.result) {
        this.imagesList = res.result.content;
      }
    }, error => {
      this.toasterService.error(_.get(this.resourceService, 'messages.fmsg.m0004'));
    });
  }

  async fileChange(ev) {
    const imageProperties = await this.getImageProperties(ev);
    if (imageProperties && imageProperties['size'] < 1) {
      this.fileObj = ev.target.files[0];
      const fileName = _.get(this.fileObj, 'name').split('.')[0];
      const userName = `${_.get(this.userService, 'userProfile.firstName')} ${_.get(this.userService, 'userProfile.lastName')}`;
      this.uploadForm.patchValue({
        'assetCaption': fileName,
        'creator': userName,
        'creatorId': _.get(this.userService, 'userProfile.id')
      });
    }
  }

  getImageProperties(ev) {
    return new Promise((resolve, reject) => {
      let imageData;
      const file = ev.target.files[0];
      const img = new Image();
      img.src = window.URL.createObjectURL(file);
      img.onload = () => {
        const width = img.naturalWidth;
        const height = img.naturalHeight;
        imageData = {
          'height': height,
          'width': width,
          'size': _.toNumber((file.size / (1024 * 1024)).toFixed(2)), // file.size,
          'type': file.type
        }
        resolve(imageData);
      };
    });
  }

  upload() {
    this.uploadCertificateService.createAsset(this.uploadForm.value).subscribe(res => {
      if (res && res.result) {
        this.uploadBlob(res);
      }
    }, error => {
      this.toasterService.error(_.get(this.resourceService, 'messages.fmsg.m0004'));
      // have to remove one the api is working - start
      const createResponse = error.error;
      this.uploadBlob(createResponse);
      //  end
    });
  }

  uploadBlob(data) {
    if (data) {
      const identifier = _.get(data, 'result.identifier');
      this.uploadCertificateService.storeAsset(this.fileObj, identifier).subscribe(imageData => {
        if (imageData.result) {
          this.showUploadUserModal = false;
          this.showSelectImageModal = false;
          const image = {
            'name': this.uploadForm.controls.assetCaption,
            'url': imageData.result.artifactUrl,
            'type': this.logoType
          }
          this.assetData.emit(image)
          this.uploadForm.reset();
          this.claseModel()
        }
      }, error => {
        this.toasterService.error(_.get(this.resourceService, 'messages.fmsg.m0004'));
        this.showUploadUserModal = false;
        this.showSelectImageModal = false;
        // have to remove once the api is working - start
        const image = {
          'name': this.uploadForm.controls.assetCaption.value,
          'url': error.error.result.artifactUrl,
          'type': this.logoType
        }
        this.assetData.emit(image)
        // end
        this.claseModel()
        this.uploadForm.reset();
      })
    }
  }

  selectLogo(logo) {
    this.selectedLogo = logo;
  }
  back(){
    this.showUploadUserModal = false;
    this.uploadForm.reset();
  }

  claseModel() {
    console.log('************close***********')
    this.showUploadUserModal = false;
    this.showSelectImageModal = false;
    this.close.emit();
  }

  selectAndUseLogo() {
    this.claseModel()
    const image = {
      'name': this.selectedLogo.name,
      'url': this.selectedLogo.artifactUrl,
      'type': this.logoType
    }
    this.assetData.emit(image)
  }
}
