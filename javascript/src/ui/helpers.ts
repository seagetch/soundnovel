export function on_element_resize(element: JQuery<any>, callback: (element: JQuery<any>)=>void) {
    let previous_width : number = element.width();
    let observer = new MutationObserver((entries)=>{
        for (let e of entries) {
            let w = $(e.target).width();
            if (w != previous_width)
                callback(element);
            previous_width = w;
        }
    });
    observer.observe(element[0], {
      attributes: true,
      attributeOldValue: true,
      attributeFilter: ['style']
    });
    return observer;
}
export function on_canvas_resize(element: JQuery<any>, callback: (element: JQuery<any>)=>void) {
    let observer = new MutationObserver((entries)=>{
        for (let e of entries) {
            callback(element);
        }
    });
    observer.observe(element[0], {
      attributes: true,
      attributeOldValue: true,
      attributeFilter: ['width', 'height']
    });
    return observer;
}