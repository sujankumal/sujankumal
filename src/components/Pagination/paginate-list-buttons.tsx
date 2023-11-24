export default function pageListButtons(currentPage: number, numberOfPages: number, setCurrentPage: Function, totalButtonDisplayOnPagination:number){
    // generates list of buttons for paginations
    let list_page: Array<number> = Array.from(Array(numberOfPages)).map((_, i) => { return i + 1; });
    let shouldDisplayDotDotDotAtEnd = false;
    let shouldDisplayDotDotDotAtStart = false;
    let dotDotDotAtStartDisplayFlag = false;

    const paginationMidVal = Math.floor(totalButtonDisplayOnPagination / 2);

    return list_page.map((val: number, index) => {
        if (currentPage + paginationMidVal < numberOfPages && val == numberOfPages) {
            // to display ... at the end
            shouldDisplayDotDotDotAtEnd = true;
        }
        if (numberOfPages > totalButtonDisplayOnPagination && currentPage > paginationMidVal+1) {
            // to display ... at start                
            if (dotDotDotAtStartDisplayFlag) {
                shouldDisplayDotDotDotAtStart = false;
            } else {
                shouldDisplayDotDotDotAtStart = true;
                dotDotDotAtStartDisplayFlag = true;
            }
        }
        let items = [];
        if(shouldDisplayDotDotDotAtEnd || shouldDisplayDotDotDotAtStart){
            items.push( 
                <li key={'a'+index}>
                    <button disabled={true} className="flex hover:bg-white hover:text-gray-500 items-center justify-center px-1 h-6 leading-tight text-gray-500 bg-white border border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">...</button>
                </li>
            )
         }
        items.push(
            (
                (currentPage - ((currentPage >= (numberOfPages - paginationMidVal))
                    ? totalButtonDisplayOnPagination - 1 - (numberOfPages - currentPage)
                    : paginationMidVal)) <= val
                &&
                (currentPage + ((currentPage <= (1 + paginationMidVal))
                    ? totalButtonDisplayOnPagination - 1 - (currentPage - 1)
                    : paginationMidVal)) >= val) ?
                <li key={index}>
                    <button onClick={() => { (currentPage === val) ? null : setCurrentPage(val) }}
                        className={`flex w-8 items-center justify-center px-1 h-6 leading-tight text-gray-500 bg-white border hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white ${(val == currentPage) ? "border-b-teal-600 dark:border-b-teal-600" : ""}`}>
                        {val}
                    </button>
                </li>
                : null
        )
        return items;  
    })

}
