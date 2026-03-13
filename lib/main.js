"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mailspring_exports_1 = require("mailspring-exports");
const message_attachments_inline_pdf_1 = __importDefault(require("./message-attachments-inline-pdf"));
const long_dash_quoted_reply_extension_1 = __importDefault(require("./extensions/long-dash-quoted-reply-extension"));
const message_owner_status_1 = __importDefault(require("./message-owner-status"));
const sticky_thread_header_1 = __importDefault(require("./sticky-thread-header"));
let CoreMessageAttachments = null;
// Activate is called when the package is loaded. If your package previously
// saved state using `serialize` it is provided.
//
function activate() {
    mailspring_exports_1.ExtensionRegistry.MessageView.register(long_dash_quoted_reply_extension_1.default);
    mailspring_exports_1.ComponentRegistry.register(message_owner_status_1.default, {
        role: 'MessageHeaderStatus',
    });
    mailspring_exports_1.ComponentRegistry.register(sticky_thread_header_1.default, {
        role: 'MessageListHeaders',
    });
    CoreMessageAttachments = mailspring_exports_1.ComponentRegistry.findComponentByName('MessageAttachments');
    if (CoreMessageAttachments) {
        mailspring_exports_1.ComponentRegistry.unregister(CoreMessageAttachments);
    }
    mailspring_exports_1.ComponentRegistry.register(message_attachments_inline_pdf_1.default, {
        role: 'MessageAttachments',
    });
}
exports.activate = activate;
// Serialize is called when your package is about to be unmounted.
// You can return a state object that will be passed back to your package
// when it is re-activated.
//
function serialize() { }
exports.serialize = serialize;
// This **optional** method is called when the window is shutting down,
// or when your package is being updated or disabled. If your package is
// watching any files, holding external resources, providing commands or
// subscribing to events, release them here.
//
function deactivate() {
    mailspring_exports_1.ExtensionRegistry.MessageView.unregister(long_dash_quoted_reply_extension_1.default);
    mailspring_exports_1.ComponentRegistry.unregister(message_owner_status_1.default);
    mailspring_exports_1.ComponentRegistry.unregister(sticky_thread_header_1.default);
    mailspring_exports_1.ComponentRegistry.unregister(message_attachments_inline_pdf_1.default);
    if (CoreMessageAttachments) {
        mailspring_exports_1.ComponentRegistry.register(CoreMessageAttachments, {
            role: 'MessageAttachments',
        });
    }
    CoreMessageAttachments = null;
}
exports.deactivate = deactivate;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsMkRBQTBFO0FBRTFFLHNHQUEyRTtBQUMzRSxxSEFBeUY7QUFDekYsa0ZBQXdEO0FBQ3hELGtGQUF3RDtBQUV4RCxJQUFJLHNCQUFzQixHQUFHLElBQUksQ0FBQztBQUVsQyw0RUFBNEU7QUFDNUUsZ0RBQWdEO0FBQ2hELEVBQUU7QUFDRixTQUFnQixRQUFRO0lBQ3RCLHNDQUFpQixDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsMENBQTRCLENBQUMsQ0FBQztJQUVyRSxzQ0FBaUIsQ0FBQyxRQUFRLENBQUMsOEJBQWtCLEVBQUU7UUFDN0MsSUFBSSxFQUFFLHFCQUFxQjtLQUM1QixDQUFDLENBQUM7SUFFSCxzQ0FBaUIsQ0FBQyxRQUFRLENBQUMsOEJBQWtCLEVBQUU7UUFDN0MsSUFBSSxFQUFFLG9CQUFvQjtLQUMzQixDQUFDLENBQUM7SUFFSCxzQkFBc0IsR0FBRyxzQ0FBaUIsQ0FBQyxtQkFBbUIsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO0lBQ3JGLElBQUksc0JBQXNCLEVBQUU7UUFDMUIsc0NBQWlCLENBQUMsVUFBVSxDQUFDLHNCQUFzQixDQUFDLENBQUM7S0FDdEQ7SUFFRCxzQ0FBaUIsQ0FBQyxRQUFRLENBQUMsd0NBQTJCLEVBQUU7UUFDdEQsSUFBSSxFQUFFLG9CQUFvQjtLQUMzQixDQUFDLENBQUM7QUFDTCxDQUFDO0FBbkJELDRCQW1CQztBQUVELGtFQUFrRTtBQUNsRSx5RUFBeUU7QUFDekUsMkJBQTJCO0FBQzNCLEVBQUU7QUFDRixTQUFnQixTQUFTLEtBQUksQ0FBQztBQUE5Qiw4QkFBOEI7QUFFOUIsdUVBQXVFO0FBQ3ZFLHdFQUF3RTtBQUN4RSx3RUFBd0U7QUFDeEUsNENBQTRDO0FBQzVDLEVBQUU7QUFDRixTQUFnQixVQUFVO0lBQ3hCLHNDQUFpQixDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsMENBQTRCLENBQUMsQ0FBQztJQUV2RSxzQ0FBaUIsQ0FBQyxVQUFVLENBQUMsOEJBQWtCLENBQUMsQ0FBQztJQUNqRCxzQ0FBaUIsQ0FBQyxVQUFVLENBQUMsOEJBQWtCLENBQUMsQ0FBQztJQUNqRCxzQ0FBaUIsQ0FBQyxVQUFVLENBQUMsd0NBQTJCLENBQUMsQ0FBQztJQUUxRCxJQUFJLHNCQUFzQixFQUFFO1FBQzFCLHNDQUFpQixDQUFDLFFBQVEsQ0FBQyxzQkFBc0IsRUFBRTtZQUNqRCxJQUFJLEVBQUUsb0JBQW9CO1NBQzNCLENBQUMsQ0FBQztLQUNKO0lBQ0Qsc0JBQXNCLEdBQUcsSUFBSSxDQUFDO0FBQ2hDLENBQUM7QUFiRCxnQ0FhQyJ9