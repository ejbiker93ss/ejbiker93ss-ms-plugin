"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mailspring_exports_1 = require("mailspring-exports");
const mailspring_component_kit_1 = require("mailspring-component-kit");
class MessageOwnerStatus extends mailspring_exports_1.React.Component {
    constructor() {
        super(...arguments);
        this.state = {
            deleting: false,
        };
        this._trashSingleMessage = async () => {
            const { message } = this.props;
            const trash = mailspring_exports_1.CategoryStore.getTrashCategory(message.accountId);
            if (!trash || this._inTrashFolder() || this.state.deleting) {
                return;
            }
            this.setState({ deleting: true });
            try {
                const task = new mailspring_exports_1.ChangeFolderTask({
                    folder: trash,
                    messages: [message],
                    source: 'Plugin Starter: Message Trash Button',
                });
                // Workaround for hosts that serialize empty threadIds before messageIds.
                // Keep arrays intact for willBeQueued() checks, but remove empty arrays from
                // the serialized payload sent to mailsync.
                const baseToJSON = task.toJSON.bind(task);
                task.toJSON = () => {
                    const json = baseToJSON();
                    if (Array.isArray(json.threadIds) && json.threadIds.length === 0) {
                        delete json.threadIds;
                    }
                    if (Array.isArray(json.messageIds) && json.messageIds.length === 0) {
                        delete json.messageIds;
                    }
                    return json;
                };
                mailspring_exports_1.Actions.queueTask(task);
                await mailspring_exports_1.TaskQueue.waitForPerformLocal(task);
                if (AppEnv && AppEnv.mailsyncBridge && AppEnv.mailsyncBridge.sendSyncMailNow) {
                    AppEnv.mailsyncBridge.sendSyncMailNow();
                }
            }
            finally {
                this.setState({ deleting: false });
            }
        };
    }
    componentDidMount() {
        this._applyOwnershipClasses();
    }
    componentDidUpdate() {
        this._applyOwnershipClasses();
    }
    componentWillUnmount() {
        const wrap = this._messageWrap();
        if (wrap) {
            wrap.classList.remove('sent-by-me');
            wrap.classList.remove('received-from-others');
        }
        this._syncFooterReplyArea();
    }
    _messageWrap() {
        return this._anchor ? this._anchor.closest('.message-item-wrap') : null;
    }
    _isSentByMe() {
        const { message } = this.props;
        const from = message && message.from && message.from[0];
        if (!from || !from.email) {
            return false;
        }
        const account = mailspring_exports_1.AccountStore.accountForEmail(from.email);
        return !!account && account.id === message.accountId;
    }
    _applyOwnershipClasses() {
        const wrap = this._messageWrap();
        if (!wrap) {
            return;
        }
        const sentByMe = this._isSentByMe();
        wrap.classList.toggle('sent-by-me', sentByMe);
        wrap.classList.toggle('received-from-others', !sentByMe);
        this._syncFooterReplyArea();
    }
    _syncFooterReplyArea() {
        const messageList = document.querySelector('#message-list');
        if (!messageList) {
            return;
        }
        const footerReplyArea = messageList.querySelector('.footer-reply-area-wrap');
        if (!footerReplyArea) {
            return;
        }
        const messageWraps = Array.from(messageList.querySelectorAll('.message-item-wrap'));
        const lastVisibleWrap = messageWraps.reverse().find(wrap => !wrap.classList.contains('collapsed'));
        const sentByMe = !!lastVisibleWrap && lastVisibleWrap.classList.contains('sent-by-me');
        footerReplyArea.classList.toggle('sent-by-me', sentByMe);
        footerReplyArea.classList.toggle('received-from-others', !!lastVisibleWrap && !sentByMe);
    }
    _inTrashFolder() {
        const { message } = this.props;
        const trash = mailspring_exports_1.CategoryStore.getTrashCategory(message.accountId);
        if (!trash) {
            return false;
        }
        return !!message.folder && message.folder.id === trash.id;
    }
    render() {
        const inTrash = this._inTrashFolder();
        const { deleting } = this.state;
        return (mailspring_exports_1.React.createElement("span", { className: "message-owner-status-wrap" },
            mailspring_exports_1.React.createElement("span", { className: "message-owner-status", ref: el => {
                    this._anchor = el;
                } }),
            mailspring_exports_1.React.createElement("button", { className: "btn btn-toolbar message-trash-single-btn", disabled: inTrash || deleting, onClick: this._trashSingleMessage, onMouseDown: event => event.stopPropagation(), title: inTrash ? 'Message is already in Trash' : 'Move this message to Trash', type: "button" },
                mailspring_exports_1.React.createElement(mailspring_component_kit_1.RetinaImg, { name: "toolbar-trash.png", mode: mailspring_component_kit_1.RetinaImg.Mode.ContentIsMask }))));
    }
}
exports.default = MessageOwnerStatus;
MessageOwnerStatus.displayName = 'MessageOwnerStatus';
MessageOwnerStatus.propTypes = {
    message: mailspring_exports_1.PropTypes.object.isRequired,
};
MessageOwnerStatus.containerStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    marginRight: 10,
    order: -1,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVzc2FnZS1vd25lci1zdGF0dXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvbWVzc2FnZS1vd25lci1zdGF0dXMuanN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsMkRBUTRCO0FBQzVCLHVFQUFxRDtBQUVyRCxNQUFxQixrQkFBbUIsU0FBUSwwQkFBSyxDQUFDLFNBQVM7SUFBL0Q7O1FBY0UsVUFBSyxHQUFHO1lBQ04sUUFBUSxFQUFFLEtBQUs7U0FDaEIsQ0FBQztRQTRFRix3QkFBbUIsR0FBRyxLQUFLLElBQUksRUFBRTtZQUMvQixNQUFNLEVBQUUsT0FBTyxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUMvQixNQUFNLEtBQUssR0FBRyxrQ0FBYSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNoRSxJQUFJLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxjQUFjLEVBQUUsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRTtnQkFDMUQsT0FBTzthQUNSO1lBRUQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBRWxDLElBQUk7Z0JBQ0YsTUFBTSxJQUFJLEdBQUcsSUFBSSxxQ0FBZ0IsQ0FBQztvQkFDaEMsTUFBTSxFQUFFLEtBQUs7b0JBQ2IsUUFBUSxFQUFFLENBQUMsT0FBTyxDQUFDO29CQUNuQixNQUFNLEVBQUUsc0NBQXNDO2lCQUMvQyxDQUFDLENBQUM7Z0JBRUgseUVBQXlFO2dCQUN6RSw2RUFBNkU7Z0JBQzdFLDJDQUEyQztnQkFDM0MsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQzFDLElBQUksQ0FBQyxNQUFNLEdBQUcsR0FBRyxFQUFFO29CQUNqQixNQUFNLElBQUksR0FBRyxVQUFVLEVBQUUsQ0FBQztvQkFDMUIsSUFBSSxL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