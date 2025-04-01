// tdParser/utils/stripInlineComment.ts

export function stripInlineComment(rawLine: string): {
    text: string;
    comment?: string;
  } {
    // Trova la prima occorrenza di // o --
    const idxSlash = rawLine.indexOf('//');
    const idxDash = rawLine.indexOf('--');
  
    let commentIndex = -1;
    if (idxSlash >= 0 && idxDash >= 0) {
      commentIndex = Math.min(idxSlash, idxDash);
    } else if (idxSlash >= 0) {
      commentIndex = idxSlash;
    } else if (idxDash >= 0) {
      commentIndex = idxDash;
    }
  
    if (commentIndex === -1) {
      // Nessun commento
      return { text: rawLine };
    }
  
    return {
      text: rawLine.slice(0, commentIndex),
      comment: rawLine.slice(commentIndex)
    };
  }