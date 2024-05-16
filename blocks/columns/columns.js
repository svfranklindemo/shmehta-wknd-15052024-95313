import { parseTableToJSON } from '../../scripts/helper/helper.js';
export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      const table = col.querySelector('table');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        }
      }
      if(table) {
        const storeData = parseTableToJSON(table);
        const storeWrapper = document.createElement('div');
        storeWrapper.className = 'store-list-wrapper'

        storeData.forEach(store => {
          const anchor = document.createElement('a');
          anchor.className = 'each-store'
          anchor.innerHTML = `<div><img src="${store[0]}" alt="${store[1]}" /></div><div>${store[1]}</div><div><strong>₹${store[2]}/-</strong></div>`

          storeWrapper.append(anchor);
        });

        col.insertBefore(storeWrapper, table);
        col.removeChild(table)
      }
    });
  });
}
