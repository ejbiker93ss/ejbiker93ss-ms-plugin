"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const mailspring_exports_1 = require("mailspring-exports");
const mailspring_component_kit_1 = require("mailspring-component-kit");
const { Component } = mailspring_exports_1.React;
const PDF_CONTENT_TYPE = 'application/pdf';
function isPdfFile(file) {
    const extension = (file.displayExtension() || '').toLowerCase();
    const contentType = (file.contentType || '').toLowerCase();
    return extension === 'pdf' || contentType === PDF_CONTENT_TYPE;
}
class InlinePdfViewer extends Component {
    _viewerSrc() {
        const { resourcePath } = AppEnv.getLoadSettings();
        const viewerPath = path_1.default
            .join(resourcePath, 'src', 'quickpreview', 'pdfjs-4.3.136', 'web', 'viewer.html')
            .replace('app.asar', 'app.asar.unpacked');
        return `file://${viewerPath}?file=${encodeURIComponent(`file://${this.props.filePath}`)}`;
    }
    render() {
        const { fileName, open, loading, onClose, onLoad } = this.props;
        const visibilityClass = loading ? 'is-loading' : 'is-loaded';
        return (mailspring_exports_1.React.createElement("div", { className: `inline-pdf-preview ${open ? 'is-open' : 'is-closed'} ${visibilityClass}` },
            mailspring_exports_1.React.createElement("div", { className: "inline-pdf-preview-header" },
                mailspring_exports_1.React.createElement("span", { className: "inline-pdf-preview-title", title: fileName }, fileName),
                mailspring_exports_1.React.createElement("button", { className: "btn btn-small", onClick: onClose, type: "button" }, "Close Preview")),
            mailspring_exports_1.React.createElement("div", { className: "inline-pdf-preview-body" },
                mailspring_exports_1.React.createElement("iframe", { title: `PDF preview: ${fileName}`, src: this._viewerSrc(), className: "inline-pdf-preview-iframe", onLoad: onLoad, style: { visibility: loading ? 'hidden' : 'visible' } }),
                loading ? mailspring_exports_1.React.createElement("div", { className: "inline-pdf-preview-loading" }, "Loading PDF preview\u2026") : null)));
    }
}
InlinePdfViewer.propTypes = {
    fileId: mailspring_exports_1.PropTypes.string.isRequired,
    filePath: mailspring_exports_1.PropTypes.string.isRequired,
    fileName: mailspring_exports_1.PropTypes.string.isRequired,
    open: mailspring_exports_1.PropTypes.bool.isRequired,
    loading: mailspring_exports_1.PropTypes.bool.isRequired,
    onClose: mailspring_exports_1.PropTypes.func.isRequired,
    onLoad: mailspring_exports_1.PropTypes.func.isRequired,
};
class MessageAttachmentsInlinePdf extends Component {
    constructor() {
        super(...arguments);
        this.state = {
            openPdfById: {},
            loadingPdfById: {},
        };
        this._togglePdfPreview = file => {
            const isOpen = !!this.state.openPdfById[file.id];
            this.setState(prevState => ({
                openPdfById: Object.assign(Object.assign({}, prevState.openPdfById), { [file.id]: !isOpen }),
                loadingPdfById: Object.assign(Object.assign({}, prevState.loadingPdfById), { [file.id]: isOpen ? false : true }),
            }));
        };
        this._closePdfPreview = fileId => {
            this.setState(prevState => ({
                openPdfById: Object.assign(Object.assign({}, prevState.openPdfById), { [fileId]: false }),
                loadingPdfById: Object.assign(Object.assign({}, prevState.loadingPdfById), { [fileId]: false }),
            }));
        };
        this._onPdfFrameLoad = fileId => {
            this.setState(prevState => ({
                loadingPdfById: Object.assign(Object.assign({}, prevState.loadingPdfById), { [fileId]: false }),
            }));
        };
        this._renderAttachment = (AttachmentRenderer, file) => {
            const { canRemoveAttachments, downloads, filePreviewPaths, headerMessageId, messageId } = this.props;
            const download = downloads[file.id];
            const filePath = mailspring_exports_1.AttachmentStore.pathForFile(file);
            const fileIconName = `file-${file.displayExtension()}.png`;
            const displayName = file.displayName();
            const displaySize = file.displayFileSize();
            const contentType = file.contentType;
            const displayFilePreview = AppEnv.config.get('core.attachments.displayFilePreview');
            const filePreviewPath = displayFilePreview ? filePreviewPaths[file.id] : null;
            const pdf = isPdfFile(file);
            return (mailspring_exports_1.React.createElement(AttachmentRenderer, { key: file.id, focusable: true, filePath: filePath, download: download, contentType: contentType, displayName: displayName, displaySize: displaySize, fileIconName: fileIconName, filePreviewPath: filePreviewPath, onOpenAttachment: () => mailspring_exports_1.Actions.fetchAndOpenFile(file), onSaveAttachment: () => mailspring_exports_1.Actions.fetchAndSaveFile(file), onRemoveAttachment: canRemoveAttachments
                    ? () => mailspring_exports_1.Actions.removeAttachment({ headerMessageId: headerMessageId || messageId, file })
                    : null, onClick: pdf ? () => this._togglePdfPreview(file) : null }));
        };
    }
    _renderInlinePreview(file) {
        if (!isPdfFile(file)) {
            return null;
        }
        const filePath = mailspring_exports_1.AttachmentStore.pathForFile(file);
        if (!filePath) {
            return null;
        }
        const isOpen = !!this.state.openPdfById[file.id];
        if (!isOpen) {
            return null;
        }
        return (mailspring_exports_1.React.createElement(InlinePdfViewer, { key: `pdf-preview-${file.id}`, fileId: file.id, filePath: filePath, fileName: file.displayName(), open: isOpen, loading: !!this.state.loadingPdfById[file.id], onClose: () => this._closePdfPreview(file.id), onLoad: () => this._onPdfFrameLoad(file.id) }));
    }
    render() {
        const { files } = this.props;
        const nonImageFiles = files.filter(f => !mailspring_exports_1.Utils.shouldDisplayAsImage(f));
        const imageFiles = files.filter(f => mailspring_exports_1.Utils.shouldDisplayAsImage(f));
        return (mailspring_exports_1.React.createElement("div", { className: "message-attachments-inline-pdf" },
            nonImageFiles.map(file => {
                if (isPdfFile(file) && this.state.openPdfById[file.id]) {
                    return null;
                }
                return this._renderAttachment(mailspring_component_kit_1.AttachmentItem, file);
            }),
            imageFiles.map(file => this._renderAttachment(mailspring_component_kit_1.ImageAttachmentItem, file)),
            files.map(file => this._renderInlinePreview(file))));
    }
}
exports.default = MessageAttachmentsInlinePdf;
MessageAttachmentsInlinePdf.displayName = 'MessageAttachmentsInlinePdf';
MessageAttachmentsInlinePdf.containerRequired = false;
MessageAttachmentsInlinePdf.propTypes = {
    files: mailspring_exports_1.PropTypes.array,
    downloads: mailspring_exports_1.PropTypes.object,
    headerMessageId: mailspring_exports_1.PropTypes.string,
    messageId: mailspring_exports_1.PropTypes.string,
    filePreviewPaths: mailspring_exports_1.PropTypes.object,
    canRemoveAttachments: mailspring_exports_1.PropTypes.bool,
};
MessageAttachmentsInlinePdf.defaultProps = {
    downloads: {},
    filePreviewPaths: {},
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVzc2FnZS1hdHRhY2htZW50cy1pbmxpbmUtcGRmLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL21lc3NhZ2UtYXR0YWNobWVudHMtaW5saW5lLXBkZi5qc3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxnREFBd0I7QUFDeEIsMkRBQTZGO0FBQzdGLHVFQUErRTtBQUUvRSxNQUFNLEVBQUUsU0FBUyxFQUFFLEdBQUcsMEJBQUssQ0FBQztBQUU1QixNQUFNLGdCQUFnQixHQUFHLGlCQUFpQixDQUFDO0FBRTNDLFNBQVMsU0FBUyxDQUFDLElBQUk7SUFDckIsTUFBTSxTQUFTLEdBQUcsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUNoRSxNQUFNLFdBQVcsR0FBRyxDQUFDLElBQUksQ0FBQyxXQUFXLElBQUksRUFBRSxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDM0QsT0FBTyxTQUFTLEtBQUssS0FBSyxJQUFJLFdBQVcsS0FBSyxnQkFBZ0IsQ0FBQztBQUNqRSxDQUFDO0FBRUQsTUFBTSxlQUFnQixTQUFRLFNBQVM7SUFXckMsVUFBVTtRQUNSLE1BQU0sRUFBRSxZQUFZLEVBQUUsR0FBRyxNQUFNLENBQUMsZUFBZSxFQUFFLENBQUM7UUFDbEQsTUFBTSxVQUFVLEdBQUcsY0FBSTthQUNwQixJQUFJLENBQUMsWUFBWSxFQUFFLEtBQUssRUFBRSxjQUFjLEVBQUUsZUFBZSxFQUFFLEtBQUssRUFBRSxhQUFhLENBQUM7YUFDaEYsT0FBTyxDQUFDLFVBQVUsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO1FBRTVDLE9BQU8sVUFBVSxVQUFVLFNBQVMsa0JBQWtCLENBQUMsVUFBVSxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDLEVBQUUsQ0FBQztJQUM1RixDQUFDO0lBRUQsTUFBTTtRQUNKLE1BQU0sRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFF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