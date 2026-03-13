"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mailspring_exports_1 = require("mailspring-exports");
const STYLE_ID = 'ejbiker93ss-sticky-thread-header-styles';
const ROOT_CLASS = 'ejbiker93ss-sticky-thread-header';
function ensureStyles() {
    if (document.getElementById(STYLE_ID)) {
        return;
    }
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
    #message-list.${ROOT_CLASS} .message-subject-wrap {
      position: sticky;
      top: 0;
      z-index: 30;
      margin-top: 0;
      margin-bottom: 5px;
      padding-top: 5px;
      padding-bottom: 10px;
      padding-right: 3px;
    }
  `;
    document.head.appendChild(style);
}
class StickyThreadHeader extends mailspring_exports_1.React.Component {
    constructor() {
        super(...arguments);
        this._applyStickyLayout = () => {
            const messageList = this._messageList();
            const subjectWrap = this._subjectWrap();
            if (!messageList || !subjectWrap) {
                return;
            }
            const messageListStyle = window.getComputedStyle(messageList);
            const background = messageListStyle.backgroundColor && messageListStyle.backgroundColor !== 'rgba(0, 0, 0, 0)'
                ? messageListStyle.backgroundColor
                : messageListStyle.background || '#fff';
            messageList.classList.add(ROOT_CLASS);
            subjectWrap.style.background = background;
            subjectWrap.style.boxShadow = '0 1px 0 rgba(0, 0, 0, 0.08)';
        };
    }
    componentDidMount() {
        ensureStyles();
        this._applyStickyLayout();
        window.addEventListener('resize', this._applyStickyLayout);
        if (window.ResizeObserver) {
            this._resizeObserver = new ResizeObserver(() => this._applyStickyLayout());
            const messageList = this._messageList();
            const subjectWrap = this._subjectWrap();
            if (messageList) {
                this._resizeObserver.observe(messageList);
            }
            if (subjectWrap) {
                this._resizeObserver.observe(subjectWrap);
            }
        }
    }
    componentDidUpdate(prevProps) {
        const prevThread = prevProps.thread || (prevProps.items && prevProps.items[0]);
        const currentThread = this.props.thread || (this.props.items && this.props.items[0]);
        if (prevThread !== currentThread) {
            this._applyStickyLayout();
        }
    }
    componentWillUnmount() {
        window.removeEventListener('resize', this._applyStickyLayout);
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
            this._resizeObserver = null;
        }
        const messageList = this._messageList();
        const subjectWrap = this._subjectWrap();
        if (messageList) {
            messageList.classList.remove(ROOT_CLASS);
        }
        if (subjectWrap) {
            subjectWrap.style.removeProperty('background');
            subjectWrap.style.removeProperty('box-shadow');
        }
    }
    _messageList() {
        return this._anchor ? this._anchor.closest('#message-list') : null;
    }
    _subjectWrap() {
        const messageList = this._messageList();
        return messageList ? messageList.querySelector('.message-subject-wrap') : null;
    }
    render() {
        return (mailspring_exports_1.React.createElement("span", { ref: el => {
                this._anchor = el;
            }, style: { display: 'none' } }));
    }
}
exports.default = StickyThreadHeader;
StickyThreadHeader.displayName = 'StickyThreadHeader';
StickyThreadHeader.containerRequired = false;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RpY2t5LXRocmVhZC1oZWFkZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvc3RpY2t5LXRocmVhZC1oZWFkZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSwyREFBMkM7QUFFM0MsTUFBTSxRQUFRLEdBQUcseUNBQXlDLENBQUM7QUFDM0QsTUFBTSxVQUFVLEdBQUcsa0NBQWtDLENBQUM7QUFFdEQsU0FBUyxZQUFZO0lBQ25CLElBQUksUUFBUSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsRUFBRTtRQUNyQyxPQUFPO0tBQ1I7SUFFRCxNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQzlDLEtBQUssQ0FBQyxFQUFFLEdBQUcsUUFBUSxDQUFDO0lBQ3BCLEtBQUssQ0FBQyxXQUFXLEdBQUc7b0JBQ0YsVUFBVTs7Ozs7Ozs7OztHQVUzQixDQUFDO0lBRUYsUUFBUSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDbkMsQ0FBQztBQUVELE1BQXFCLGtCQUFtQixTQUFRLDBCQUFLLENBQUMsU0FBUztJQUEvRDs7UUE2REUsdUJBQWtCLEdBQUcsR0FBRyxFQUFFO1lBQ3hCLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUN4QyxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDeEMsSUFBSSxDQUFDLFdBQVcsSUFBSSxDQUFDLFdBQVcsRUFBRTtnQkFDaEMsT0FBTzthQUNSO1lBRUQsTUFBTSxnQkFBZ0IsR0FBRyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDOUQsTUFBTSxVQUFVLEdBQ2QsZ0JBQWdCLENBQUMsZUFBZSxJQUFJLGdCQUFnQixDQUFDLGVBQWUsS0FBSyxrQkFBa0I7Z0JBQ3pGLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxlQUFlO2dCQUNsQyxDQUFDLENB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