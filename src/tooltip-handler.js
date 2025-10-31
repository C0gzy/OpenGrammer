// Handle tooltip display for grammar errors

export function initTooltips(container) {
  const containerElement = typeof container === 'string' 
    ? document.querySelector(container) 
    : container;
  
  if (!containerElement) {
    console.warn('Tooltip container not found');
    return;
  }
  
  // Clean up any existing listeners first
  removeTooltips(containerElement);
  
  const errorElements = containerElement.querySelectorAll('.grammar-error');
  
  errorElements.forEach((element) => {
    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);
    element.addEventListener('mousemove', handleMouseMove);
  });
}

export function removeTooltips(container) {
  const containerElement = typeof container === 'string' 
    ? document.querySelector(container) 
    : container;
  
  if (!containerElement) {
    return;
  }
  
  const errorElements = containerElement.querySelectorAll('.grammar-error');
  
  errorElements.forEach((element) => {
    element.removeEventListener('mouseenter', handleMouseEnter);
    element.removeEventListener('mouseleave', handleMouseLeave);
    element.removeEventListener('mousemove', handleMouseMove);
  });
  
  // Clean up any visible tooltip
  const existingTooltip = document.querySelector('.grammar-tooltip');
  if (existingTooltip) {
    existingTooltip.remove();
  }
}

function handleMouseEnter(event) {
  const element = event.target;
  const suggestions = JSON.parse(element.getAttribute('data-suggestions') || '[]');
  const message = element.getAttribute('data-message') || 'Grammar error';
  
  createTooltip(element, message, suggestions);
}

function handleMouseLeave(event) {
  removeTooltip();
}

function handleMouseMove(event) {
  const tooltip = document.querySelector('.grammar-tooltip');
  if (tooltip) {
    positionTooltip(event, tooltip);
  }
}

function createTooltip(element, message, suggestions) {
  removeTooltip();
  
  const tooltip = document.createElement('div');
  tooltip.className = 'grammar-tooltip';
  
  const messageEl = document.createElement('div');
  messageEl.className = 'grammar-tooltip-message';
  messageEl.textContent = message;
  tooltip.appendChild(messageEl);
  
  if (suggestions && suggestions.length > 0) {
    const suggestionsEl = document.createElement('div');
    suggestionsEl.className = 'grammar-tooltip-suggestions';
    
    const suggestionsLabel = document.createElement('div');
    suggestionsLabel.className = 'grammar-tooltip-label';
    suggestionsLabel.textContent = 'Suggestions:';
    suggestionsEl.appendChild(suggestionsLabel);
    
    const suggestionsList = document.createElement('ul');
    suggestionsList.className = 'grammar-tooltip-list';
    
    suggestions.forEach((suggestion) => {
      const li = document.createElement('li');
      li.textContent = suggestion;
      suggestionsList.appendChild(li);
    });
    
    suggestionsEl.appendChild(suggestionsList);
    tooltip.appendChild(suggestionsEl);
  }
  
  document.body.appendChild(tooltip);
  
  const rect = element.getBoundingClientRect();
  positionTooltip({ clientX: rect.left + rect.width / 2, clientY: rect.top }, tooltip);
  
  // Fade in animation
  setTimeout(() => {
    tooltip.classList.add('grammar-tooltip-visible');
  }, 10);
}

function positionTooltip(event, tooltip) {
  const tooltipRect = tooltip.getBoundingClientRect();
  const padding = 10;
  
  let left = event.clientX - tooltipRect.width / 2;
  let top = event.clientY - tooltipRect.height - padding;
  
  // Keep tooltip on screen
  if (left < padding) {
    left = padding;
  } else if (left + tooltipRect.width > window.innerWidth - padding) {
    left = window.innerWidth - tooltipRect.width - padding;
  }
  
  if (top < padding) {
    top = event.clientY + padding;
  }
  
  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

function removeTooltip() {
  const tooltip = document.querySelector('.grammar-tooltip');
  if (tooltip) {
    tooltip.remove();
  }
}

