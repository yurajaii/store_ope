function Card({ amt, act }) {
  return (
    <>
      <div
        className="flex flex-col gap-1 items-center justify-center h-30 lg:h-28 py-4  px-12 bg-white  border-gray-300 rounded-3xl border hover:scale-105 hover:cursor-pointer transition-transform duration-300 ease-in-out"
      >
        <p className="text-lg w-full text-left">{act}</p>
        <p className="text-2xl w-full text-center font-semibold text-primary ">{amt}</p>
      </div>
    </>
  )
}

export default Card
