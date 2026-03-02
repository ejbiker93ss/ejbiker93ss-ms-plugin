import path from 'path';
import { React, PropTypes, Actions, Utils, AttachmentStore, File } from 'mailspring-exports';
import { AttachmentItem, ImageAttachmentItem } from 'mailspring-component-kit';

const { Component } = React;

const PDF_CONTENT_TYPE = 'application/pdf';

function isPdfFile(file) {
  const extension = (file.displayExtension() || '').toLowerCase();
  const contentType = (file.contentType || '').toLowerCase();
  return extension === 'pdf' || contentType === PDF_CONTENT_TYPE;
}

class InlinePdfViewer extends Component {
  static propTypes = {
    fileId: PropTypes.string.isRequired,
    filePath: PropTypes.string.isRequired,
    fileName: PropTypes.string.isRequired,
    open: PropTypes.bool.isRequired,
    loading: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onLoad: PropTypes.func.isRequired,
  };

  _viewerSrc() {
    const { resourcePath } = AppEnv.getLoadSettings();
    const viewerPath = path
      .join(resourcePath, 'src', 'quickpreview', 'pdfjs-4.3.136', 'web', 'viewer.html')
      .replace('app.asar', 'app.asar.unpacked');

    return `file://${viewerPath}?file=${encodeURIComponent(`file://${this.props.filePath}`)}`;
  }

  render() {
    const { fileName, open, loading, onClose, onLoad } = this.props;
    const visibilityClass = loading ? 'is-loading' : 'is-loaded';

    return (
      <div className={`inline-pdf-preview ${open ? 'is-open' : 'is-closed'} ${visibilityClass}`}>
        <div className="inline-pdf-preview-header">
          <span className="inline-pdf-preview-title" title={fileName}>
            {fileName}
          </span>
          <button className="btn btn-small" onClick={onClose} type="button">
            Close Preview
          </button>
        </div>
        <div className="inline-pdf-preview-body">
          <iframe
            title={`PDF preview: ${fileName}`}
            src={this._viewerSrc()}
            className="inline-pdf-preview-iframe"
            onLoad={onLoad}
            style={{ visibility: loading ? 'hidden' : 'visible' }}
          />
          {loading ? <div className="inline-pdf-preview-loading">Loading PDF preview…</div> : null}
        </div>
      </div>
    );
  }
}

export default class MessageAttachmentsInlinePdf extends Component {
  static displayName = 'MessageAttachmentsInlinePdf';

  static containerRequired = false;

  static propTypes = {
    files: PropTypes.array,
    downloads: PropTypes.object,
    headerMessageId: PropTypes.string,
    messageId: PropTypes.string,
    filePreviewPaths: PropTypes.object,
    canRemoveAttachments: PropTypes.bool,
  };

  static defaultProps = {
    downloads: {},
    filePreviewPaths: {},
  };

  state = {
    openPdfById: {},
    loadingPdfById: {},
  };

  _togglePdfPreview = file => {
    const isOpen = !!this.state.openPdfById[file.id];

    this.setState(prevState => ({
      openPdfById: {
        ...prevState.openPdfById,
        [file.id]: !isOpen,
      },
      loadingPdfById: {
        ...prevState.loadingPdfById,
        [file.id]: isOpen ? false : true,
      },
    }));
  };

  _closePdfPreview = fileId => {
    this.setState(prevState => ({
      openPdfById: {
        ...prevState.openPdfById,
        [fileId]: false,
      },
      loadingPdfById: {
        ...prevState.loadingPdfById,
        [fileId]: false,
      },
    }));
  };

  _onPdfFrameLoad = fileId => {
    this.setState(prevState => ({
      loadingPdfById: {
        ...prevState.loadingPdfById,
        [fileId]: false,
      },
    }));
  };

  _renderAttachment = (AttachmentRenderer, file) => {
    const { canRemoveAttachments, downloads, filePreviewPaths, headerMessageId, messageId } = this.props;
    const download = downloads[file.id];
    const filePath = AttachmentStore.pathForFile(file);
    const fileIconName = `file-${file.displayExtension()}.png`;
    const displayName = file.displayName();
    const displaySize = file.displayFileSize();
    const contentType = file.contentType;
    const displayFilePreview = AppEnv.config.get('core.attachments.displayFilePreview');
    const filePreviewPath = displayFilePreview ? filePreviewPaths[file.id] : null;
    const pdf = isPdfFile(file);

    return (
      <AttachmentRenderer
        key={file.id}
        focusable
        filePath={filePath}
        download={download}
        contentType={contentType}
        displayName={displayName}
        displaySize={displaySize}
        fileIconName={fileIconName}
        filePreviewPath={filePreviewPath}
        onOpenAttachment={() => Actions.fetchAndOpenFile(file)}
        onSaveAttachment={() => Actions.fetchAndSaveFile(file)}
        onRemoveAttachment={
          canRemoveAttachments
            ? () => Actions.removeAttachment({ headerMessageId: headerMessageId || messageId, file })
            : null
        }
        onClick={pdf ? () => this._togglePdfPreview(file) : null}
      />
    );
  };

  _renderInlinePreview(file) {
    if (!isPdfFile(file)) {
      return null;
    }

    const filePath = AttachmentStore.pathForFile(file);
    if (!filePath) {
      return null;
    }

    const isOpen = !!this.state.openPdfById[file.id];
    if (!isOpen) {
      return null;
    }

    return (
      <InlinePdfViewer
        key={`pdf-preview-${file.id}`}
        fileId={file.id}
        filePath={filePath}
        fileName={file.displayName()}
        open={isOpen}
        loading={!!this.state.loadingPdfById[file.id]}
        onClose={() => this._closePdfPreview(file.id)}
        onLoad={() => this._onPdfFrameLoad(file.id)}
      />
    );
  }

  render() {
    const { files } = this.props;
    const nonImageFiles = files.filter(f => !Utils.shouldDisplayAsImage(f));
    const imageFiles = files.filter(f => Utils.shouldDisplayAsImage(f));

    return (
      <div className="message-attachments-inline-pdf">
        {nonImageFiles.map(file => {
          if (isPdfFile(file) && this.state.openPdfById[file.id]) {
            return null;
          }
          return this._renderAttachment(AttachmentItem, file);
        })}
        {imageFiles.map(file => this._renderAttachment(ImageAttachmentItem, file))}
        {files.map(file => this._renderInlinePreview(file))}
      </div>
    );
  }
}
