import React, { useEffect, useState } from 'react'
import './List.css'
import { url, currency } from '../../assets/assets'
import axios from 'axios';
import { toast } from 'react-toastify';
import { getImageUrl } from '../../utils/imageUtils';
import ImageWithFallback from '../../components/ImageWithFallback/ImageWithFallback';

const List = () => {

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchList = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${url}/api/food/list`)
      if (response.data.success) {
        console.log('Food list data:', response.data.data);
        setList(response.data.data);
      }
      else {
        toast.error("Error fetching food list")
      }
    } catch (error) {
      console.error('Error fetching food list:', error);
      toast.error("Failed to load food list");
    } finally {
      setLoading(false);
    }
  }

  const removeFood = async (foodId) => {
    const response = await axios.post(`${url}/api/food/remove`, {
      id: foodId
    })
    await fetchList();
    if (response.data.success) {
      toast.success(response.data.message);
    }
    else {
      toast.error("Error")
    }
  }

  useEffect(() => {
    fetchList();
  }, [])

  return (
    <div className='list add flex-col'>
      <p>All Foods List</p>
      {loading ? (
        <div className="loading">Loading food items...</div>
      ) : (
        <div className='list-table'>
          <div className="list-table-format title">
            <b>Image</b>
            <b>Name</b>
            <b>Category</b>
            <b>Price</b>
            <b>Action</b>
          </div>
          {list.map((item, index) => {
            return (
              <div key={index} className='list-table-format'>
                <div className="food-image-container">
                  <ImageWithFallback 
                    src={item.image} 
                    alt={item.name} 
                    className="food-list-image" 
                  />
                </div>
                <p title={item.name}>{item.name}</p>
                <p>{item.category}</p>
                <p>{currency}{item.price}</p>
                <p className='cursor' onClick={() => removeFood(item._id)}>x</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default List
