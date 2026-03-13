"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mailspring_exports_1 = require("mailspring-exports");
const mailspring_component_kit_1 = require("mailspring-component-kit");
const PREF_DESCENDING_ORDER = 'core.reading.descendingOrderMessageList';
const MINIFY_THRESHOLD = 3;
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
        this._startReplyAreaObserver();
    }
    componentDidUpdate() {
        this._applyOwnershipClasses();
    }
    componentWillUnmount() {
        this._stopReplyAreaObserver();
        const wrap = this._messageWrap();
        if (wrap) {
            wrap.classList.remove('sent-by-me');
            wrap.classList.remove('received-from-others');
        }
        this._syncReplyAreaClasses();
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
        this._syncAllMessageOwnershipClasses();
        this._syncReplyAreaClasses();
    }
    _isSentMessage(message) {
        if (!message) {
            return false;
        }
        if (message.draft) {
            return true;
        }
        const from = message.from && message.from[0];
        if (!from || !from.email) {
            return false;
        }
        const account = mailspring_exports_1.AccountStore.accountForEmail(from.email);
        return !!account && account.id === message.accountId;
    }
    _startReplyAreaObserver() {
        if (this._replyAreaObserver || !window.MutationObserver) {
            return;
        }
        const messageList = document.querySelector('#message-list');
        if (!messageList) {
            return;
        }
        this._replyAreaObserver = new MutationObserver(() => {
            this._syncAllMessageOwnershipClasses();
            this._syncReplyAreaClasses();
        });
        this._replyAreaObserver.observe(messageList, {
            childList: true,
            subtree: true,
        });
    }
    _stopReplyAreaObserver() {
        if (this._replyAreaObserver) {
            this._replyAreaObserver.disconnect();
            this._replyAreaObserver = null;
        }
    }
    _syncReplyAreaClasses() {
        const messageList = document.querySelector('#message-list');
        if (!messageList) {
            return;
        }
        this._syncReplyAreaTarget(messageList.querySelector('.footer-reply-area-wrap'), true, false);
        Array.from(messageList.querySelectorAll('.composer-outer-wrap')).forEach(composerWrap => {
            this._syncReplyAreaTarget(composerWrap, true, false);
            this._syncReplyAreaTarget(composerWrap.closest('.message-item-wrap'), true, false);
        });
    }
    _syncAllMessageOwnershipClasses() {
        const messageList = document.querySelector('#message-list');
        if (!messageList) {
            return;
        }
        let messages = this._visibleMessages(mailspring_exports_1.MessageStore.items() || []);
        if (AppEnv.config.get(PREF_DESCENDING_ORDER)) {
            messages = [...messages].reverse();
        }
        const messageWraps = Array.from(messageList.querySelectorAll('.message-item-wrap'));
        messageWraps.forEach((wrap, index) => {
            const message = messages[index];
            if (!message) {
                wrap.classList.remove('sent-by-me');
                wrap.classList.remove('received-from-others');
                return;
            }
            const sentByMe = this._isSentMessage(message);
            wrap.classList.toggle('sent-by-me', sentByMe);
            wrap.classList.toggle('received-from-others', !sentByMe);
        });
    }
    _visibleMessages(allMessages) {
        const messagesExpandedState = mailspring_exports_1.MessageStore.itemsExpandedState();
        const messages = [...allMessages];
        const minifyRanges = [];
        let consecutiveCollapsed = 0;
        messages.forEach((message, idx) => {
            if (idx === 0) {
                return;
            }
            const expandState = messagesExpandedState[message.id];
            if (!expandState) {
                consecutiveCollapsed += 1;
            }
            else {
                const minifyOffset = expandState === 'default' ? 1 : 0;
                if (consecutiveCollapsed >= MINIFY_THRESHOLD + minifyOffset) {
                    minifyRanges.push({
                        start: idx - consecutiveCollapsed,
                        length: consecutiveCollapsed - minifyOffset,
                    });
                }
                consecutiveCollapsed = 0;
            }
        });
        let indexOffset = 0;
        for (const range of minifyRanges) {
            const start = range.start - indexOffset;
            messages.splice(start, range.length);
            indexOffset += range.length;
        }
        return messages;
    }
    _syncReplyAreaTarget(target, sentByMe, receivedFromOthers) {
        if (!target) {
            return;
        }
        const hasSentByMe = target.classList.contains('sent-by-me');
        const hasReceivedFromOthers = target.classList.contains('received-from-others');
        if (hasSentByMe !== sentByMe) {
            target.classList.toggle('sent-by-me', sentByMe);
        }
        if (hasReceivedFromOthers !== receivedFromOthers) {
            target.classList.toggle('received-from-others', receivedFromOthers);
        }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVzc2FnZS1vd25lci1zdGF0dXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvbWVzc2FnZS1vd25lci1zdGF0dXMuanN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsMkRBUzRCO0FBQzVCLHVFQUFxRDtBQUVyRCxNQUFNLHFCQUFxQixHQUFHLHlDQUF5QyxDQUFDO0FBQ3hFLE1BQU0sZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDO0FBRTNCLE1BQXFCLGtCQUFtQixTQUFRLDBCQUFLLENBQUMsU0FBUztJQUEvRDs7UUFjRSxVQUFLLEdBQUc7WUFDTixRQUFRLEVBQUUsS0FBSztTQUNoQixDQUFDO1FBc01GLHdCQUFtQixHQUFHLEtBQUssSUFBSSxFQUFFO1lBQy9CLE1BQU0sRUFBRSxPQUFPLEVBQUUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQy9CLE1BQU0sS0FBSyxHQUFHLGtDQUFhLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ2hFLElBQUksQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLGNBQWMsRUFBRSxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFO2dCQUMxRCxPQUFPO2FBQ1I7WUFFRCxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFFbEMsSUFBSTtnQkFDRixNQUFNLElBQUksR0FBRyxJQUFJLHFDQUFnQixDQUFDO29CQUNoQyxNQUFNLEVBQUUsS0FBSztvQkFDYixRQUFRLEVBQUUsQ0FBQyxPQUFPLENBQUM7b0JBQ25CLE1BQU0sRUFBRSxzQ0FBc0M7aUJBQy9DLENBQUMsQ0FBQztnQkFFSCx5RUFBeUU7Z0JBQ3pFLDZFQUE2RTtnQkFDN0UsMkNBQTJDO2dCQUMzQyxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDMUMsSUFBSSxDQUFDLE1B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