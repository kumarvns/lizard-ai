/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react'
import getYoutubeId from 'get-youtube-id';
import { toast } from 'sonner';
import { IoMdDownload } from "react-icons/io";
import { MdPlayCircleFilled } from 'react-icons/md';
import YoutubeCard from './YoutubeCard';
import { downloadYoutubeVideo, getTubeDownloadedVideos } from '../lib/media';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';

const appUri = import.meta.env.VITE_REACT_APP_API;

export default function YoutubeVideo({ selectImage, handleClose }) {

    const { id } = useParams();
    const [link, setLink] = useState('');
    const [key, setKey] = useState(Date.now());
    const [url, setUrl] = useState(null);
    const [time, setTime] = useState({
        start: 0,
        end: 0
    });

    useEffect(() => {
        player();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [link]);

    const player = () => {
        const id = getYoutubeId(link);
        let newUrl = id ? `https://www.youtube.com/embed/${id}?autoplay=1&modestbranding=1&mute=1&rel=0` : null;

        if (time.start > 0 && time.end > 0 && time.start > time.end) {
            toast.error('Start time should be less than end time', { duration: 3000 });
            return;
        } else if (time.start > 0 && time.end > 0 && time.start === time.end) {
            toast.error('Start time and end time should not be same', { duration: 3000 });
            return;
        } else if (time.start > 0) {
            newUrl += `&start=${parseInt(time.start)}`;
        }

        if (time.end > 0) {
            newUrl += `&end=${parseInt(time.end)}`;
        }

        setUrl(newUrl);

        const newKey = Date.now();
        setKey(newKey);
    }

    const changeTime = (e) => {
        const value = e.target.value;
        const name = e.target.name;

        setTime({ ...time, [name]: value ? parseInt(value) : 0 });
    }

    const { data: videos, refetch, isPending } = useQuery({ queryKey: ['youtubeVideo'], queryFn: getTubeDownloadedVideos, refetchOnWindowFocus: true });

    const handleDownload = async () => {
        if (!url) {
            toast.error('Please enter a valid youtube video url', { duration: 3000 });
            return;
        }
        if (time.start > 0 && time.end > 0 && time.start > time.end) {
            toast.error('Start time should be less than end time', { duration: 3000 });
            return;
        } else if (time.start > 0 && time.end > 0 && time.start === time.end) {
            toast.error('Start time and end time should not be same', { duration: 3000 });
            return;
        }

        await downloadYoutubeVideo(url, id, time.start, time.end);
        refetch();
    }

    return (
        <div>
            <div className='border-b border-border-light dark:border-border-dark w-full'>
                <div className='w-full px-2 md:px-4 py-3 flex items-center justify-between gap-x-4'>
                    <input
                        className="outline-none w-full h-10 rounded-3xl bg-primary-light dark:bg-primary-dark border border-neutral-400 px-4 opacity-70"
                        value={link}
                        onChange={(e) => setLink(e.target.value)}
                        type="text"
                        required
                        placeholder='Paste Youtube video URL' />
                </div>
            </div>

            <div className='px-2 bg-primary-light dark:bg-primary-dark md:px-4 py-3 flex flex-col items-center gap-5 overflow-y-auto h-[75vh]'>
                <div className={(url ? "block" : "hidden") + " w-full h-full"}>
                    <div className='bg-neutral-200 dark:bg-neutral-950 flex justify-center md:min-w-[37.5rem] md:min-h-[25rem]'>
                        {url ? (
                            <iframe width="100%" height="100%" title='video' key={key}
                                src={url}
                                className='md:min-w-[37.5rem] md:min-h-[25rem]'
                                frameBorder="0" allow="accelerometer; autoPlay; encrypted-media; gyroscope; picture-in-picture; fullscreen">
                            </iframe>
                        ) : (
                            <div className='h-full opacity-90 flex items-center justify-center'>
                                <h2>Enter video link to see preview</h2>
                            </div>
                        )}
                    </div>
                    <div className='flex md:flex-row flex-col mt-4 gap-y-2 justify-between items-center w-full px-4 text-text-light dark:text-text-dark'>

                        <div className='flex items-center gap-2'>
                            {/* Start Time */}
                            <div>
                                <p>Start Time</p>

                                <div className="bg-transparent w-24 border border-gray-200 rounded-lg dark:border-gray-700">
                                    <div className="w-full flex justify-between items-center gap-x-1">
                                        <div className="grow py-2 px-3">
                                            <span className="block text-xs text-gray-500 dark:text-gray-400">
                                                In seconds
                                            </span>
                                            <input className="w-full outline-none p-0 bg-transparent border-0 text-gray-800 focus:ring-0 dark:text-white" type="text" name='start' onChange={changeTime} value={time.start} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* End Time */}
                            <div>
                                <p>End Time</p>

                                <div className="bg-transparent w-24 border border-gray-200 rounded-lg dark:border-gray-700">
                                    <div className="w-full flex justify-between items-center gap-x-1">
                                        <div className="grow py-2 px-3">
                                            <span className="block text-xs text-gray-500 dark:text-gray-400">
                                                In seconds
                                            </span>
                                            <input className="w-full outline-none p-0 bg-transparent border-0 text-gray-800 focus:ring-0 dark:text-white" type="text" name='end' onChange={changeTime} value={time.end} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className='flex items-center justify-between gap-3'>
                            <button type='button' className='flex gap-1 h-fit items-center transition duration-150 hover:scale-105' onClick={() => player()}>
                                <span className='text-rose-500'>
                                    <MdPlayCircleFilled size={30} />
                                </span>
                                <span>Replay</span>
                            </button>
                            <button type='button' className='flex opacity-90 hover:opacity-100 gap-1 h-fit items-center transition duration-150 hover:scale-105' onClick={handleDownload}>
                                <span className='text-text-light dark:text-gray-50'>
                                    <IoMdDownload size={25} />
                                </span>
                                <span>Download</span>
                            </button>
                        </div>
                    </div>
                </div>


                <div className='w-full px-4'>
                    <div className='w-full text-start'>
                        <h2 className='font-semibold text-lg'>Your Videos</h2>
                    </div>

                    <div className='py-3 flex flex-wrap gap-x-5 gap-y-5'>
                        {isPending && (
                            <div className='flex items-center justify-center w-full h-full'>
                                <h2>Loading...</h2>
                            </div>
                        )}
                        {videos && videos.map((video, index) => (
                            <button type='button' key={index} className='h-fit' onClick={() => {
                                const thumbnail = `${appUri}/media/youtube/${video.split('_')[0]}_thumbnail.png`;
                                selectImage(thumbnail, video, 'utube');
                                handleClose();
                            }}>
                                <YoutubeCard key={index} name={video} />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}