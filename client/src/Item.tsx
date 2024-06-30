import { createEffect, createSignal, onCleanup, type Component } from 'solid-js';
import { format } from "date-fns";

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);

  return format(dateStr, "yyyy-MM-dd")
}

export interface IItem {
  title: string,
  link: string,
  thumbnail: string,
  author: {
    name: string,
    link: string
  },
  authorImgSrc: string,
  postedOn: string,
  updatedOn: string,
  imagesSrcs: string[]
}

const Item: Component<{ item: IItem }> = (props) => {
  const [lastLink, setLastLink] = createSignal<string | undefined>(undefined);
  const [currentImageDisplayed, setCurrentImageDisplayed] = createSignal(1);

  createEffect(() => {
    const sliderEle = document.getElementById("slider");
    if (lastLink() === props.item.link) {
      let interval: number = -1;

      let index = 0;

      if (sliderEle) {
        console.log("SetInterval");

        // sliderEle.style.transform = `translateX(0)`;
        interval = setInterval(() => {
          const imagesEles = document.querySelectorAll("#slider img");
          index = (index + 1) % imagesEles.length;
          setCurrentImageDisplayed(index + 1);
          sliderEle.style.transform = `translateX(-${index * 100}%)`;
        }, 1000 * 3);
      }

      onCleanup(() => clearInterval(interval));
    } else {
      setCurrentImageDisplayed(1);
      setLastLink(props.item.link);
      if (sliderEle) sliderEle.style.transform = "";
    }
  });

  return (
    <div>
      <p class="text-center font-bold text-lg">
        {props.item.title}
      </p>
      <a class="text-center underline text-yellow-100 block" href={props.item.link}>Visit</a>

      <div class="flex overflow-x-hidden relative w-full">
        <div id="slider" class="flex transition-transform duration-700 ease-in-out">
          {props.item.imagesSrcs.map(src => <img src={src} class="w-full flex-shrink-0" />)}
        </div>
      </div>

      <div>
        <p>{currentImageDisplayed()} / {props.item.imagesSrcs.length}</p>
      </div>

      <div class="p-2 flex gap-4 w-full">
        <div>
          <p class="font-bold">Author</p>
          <p><a class="underline text-yellow-100" href={props.item.author.link}>{props.item.author.name}</a></p>
        </div>

        <div>
          <p class="font-bold">Details</p>
          <p>Posted: <span class="font-bold">{formatDate(props.item.postedOn)}</span></p>
          <p>Updated: <span class="font-bold">{formatDate(props.item.updatedOn)}</span></p>
        </div>
      </div>
    </div>
  );
};

export default Item;
