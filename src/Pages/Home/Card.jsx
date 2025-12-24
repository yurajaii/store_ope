function Card({ amt, topic, act }) {
  return (
    <>
      <div className="flex flex-col gap-3.5 justify-center items-center w-68 h-50 bg-white  border-gray-200 rounded-3xl shadow-md hover:scale-105 hover:cursor-pointer transition-transform duration-300 ease-in-out">
        <p className="text-4xl font-semibold text-primary p-2">{amt}</p>
        <p>{topic}</p>
        <p className="text-xl">{act}</p>
      </div>
    </>
  )
}

export default Card;