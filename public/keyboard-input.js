// Steering remains available after clicking a control, without stealing its activation.
export function ownsKeyboard(target,code){
 if(target?.closest?.('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"]'))return true;
 return ['Space','Enter'].includes(code)&&!!target?.closest?.('button,a[href],[role="button"]');
}
