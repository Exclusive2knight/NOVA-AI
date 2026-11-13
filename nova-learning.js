/* NOVA Turbo Learning: user-controlled, instant correction learning through cloud recall.
 * Only user-authored correction statements are saved. No model outputs, full chats,
 * private files, scraped pages or hidden weight updates are used for training.
 */
(function(root){
 'use strict';
 const sensitive=/\b(?:password|passcode|api[- _]?key|private key|access token|bearer token|recovery code|credit card|bank account|social security|ssn|phone number|street address|diagnosis|prescription|medical record|date of birth|sexual orientation|religion|political party)\b/i;
 const personal=/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|(?:\+?1[-. ]?)?\(?\d{3}\)?[-. ]?\d{3}[-. ]?\d{4}|\b\d{9,}\b/i;
 const command=/\b(?:forget|delete|erase|remove)\s+(?:my|your|the|this|that|all)?\s*(?:memory|memories|history|data|information|conversation)\b/i;
 function clean(text){return String(text||'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim()}
 function isCorrection(text){
  return /^(?:no(?:[,:!\s]+(?:i|u|you|we|it|the|that|this|not|instead|make|use|keep|try|what|please|actually|i meant))|nah[,:!\s]+|actually[,:!\s]+|i (?:meant|mean|said)\b|what i meant\b|that's (?:not right|wrong|incorrect)\b|that is (?:not right|wrong|incorrect)\b|you (?:forgot|missed|got .{1,35} wrong)\b|instead[,:!\s]+|i (?:don't|do not) want\b|please (?:don't|do not)\b|not (?:like that|the|a|that|this)\b)/i.test(text)
 }
 function correction(current,previousUser){
  const update=clean(current),topic=clean(previousUser);
  if(update.length<12||update.length>1400||topic.length<8||!isCorrection(update))return '';
  if(sensitive.test(update)||sensitive.test(topic)||personal.test(update)||personal.test(topic)||command.test(update)||command.test(topic))return '';
  // Previous USER prompt is only a search topic, not a made-up interpretation
  // of the model's answer or permission to collect the chat transcript.
  return 'Correction to earlier user request: '+topic.slice(0,200)+'; user clarified: '+update.slice(0,1100);
 }
 root.NOVAQuickLearn=Object.freeze({correction,isCorrection});
})(typeof window!=='undefined'?window:globalThis);
