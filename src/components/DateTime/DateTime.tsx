import { CalendarMonth } from "@mui/icons-material";

function DateTime({datetime}: {datetime:Date}) {
    const date_time = new Date(datetime);
    return <div className="inline-flex text-gray-500 italic">
        <CalendarMonth  className="flex-row self-center" fontSize="small" />
        <span className="hover:text-teal-600 ml-1 inline-flex flex-row self-center">{date_time.toUTCString()}</span>
    </div>;
}

export default DateTime;