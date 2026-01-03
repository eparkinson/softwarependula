// Wrap news stories in individual cards
document.addEventListener('DOMContentLoaded', function() {
    const newsStories = document.querySelector('.news-stories');
    if (!newsStories) return;
    
    // Get all h3 elements (story titles)
    const storyTitles = newsStories.querySelectorAll('h3');
    
    storyTitles.forEach(function(h3) {
        // Create a card div
        const card = document.createElement('div');
        card.className = 'news-story-card';
        
        // Insert the card before the h3
        h3.parentNode.insertBefore(card, h3);
        
        // Move the h3 into the card
        card.appendChild(h3);
        
        // Move subsequent elements into the card until we hit another h2, h3, or hr
        let nextElement = card.nextSibling;
        while (nextElement && 
               nextElement.nodeName !== 'H2' && 
               nextElement.nodeName !== 'H3' && 
               nextElement.nodeName !== 'HR' &&
               !nextElement.classList?.contains('news-category-header')) {
            const current = nextElement;
            nextElement = nextElement.nextSibling;
            
            // Skip text nodes that are just whitespace
            if (current.nodeType === 3 && current.textContent.trim() === '') {
                continue;
            }
            
            card.appendChild(current);
        }
    });
});
